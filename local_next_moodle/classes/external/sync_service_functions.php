<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle. If not, see <https://www.gnu.org/licenses/>.

/**
 * External function: sync_service_functions.
 *
 * @package   local_next_moodle
 * @copyright 2024 studiolxd
 * @license   https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_next_moodle\external;

// Moodle 4.1 compatibility: the external API was moved to core_external in 4.2.
if (!class_exists('\core_external\external_api')) {
    class_alias('\external_api', '\core_external\external_api');
    class_alias('\external_function_parameters', '\core_external\external_function_parameters');
    class_alias('\external_multiple_structure', '\core_external\external_multiple_structure');
    class_alias('\external_single_structure', '\core_external\external_single_structure');
    class_alias('\external_value', '\core_external\external_value');
}

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Syncs a caller-supplied list of Moodle web service function names to the target
 * external service configured in the plugin settings.
 *
 * Functions present in the list but absent from the service are added.
 * Functions present in the service but absent from the list are removed.
 * The sync function itself (local_next_moodle_sync_service_functions) is never removed.
 */
class sync_service_functions extends external_api {

    /** The sync function must never be removed from the service. */
    const SELF_FUNCTION = 'local_next_moodle_sync_service_functions';

    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'functions' => new external_multiple_structure(
                new external_value(PARAM_ALPHANUMEXT, 'Moodle web service function name'),
                'List of function names that should be present in the target service'
            ),
            'dryrun' => new external_value(
                PARAM_BOOL,
                'If true, compute the diff but do not apply any changes',
                VALUE_DEFAULT,
                false
            ),
        ]);
    }

    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'service_id'   => new external_value(PARAM_INT,  'ID of the target external service'),
            'service_name' => new external_value(PARAM_TEXT, 'Name of the target external service'),
            'added'        => new external_multiple_structure(
                new external_value(PARAM_ALPHANUMEXT, 'Function name'),
                'Functions added to the service'
            ),
            'removed'      => new external_multiple_structure(
                new external_value(PARAM_ALPHANUMEXT, 'Function name'),
                'Functions removed from the service'
            ),
            'unchanged'    => new external_multiple_structure(
                new external_value(PARAM_ALPHANUMEXT, 'Function name'),
                'Functions already present in the service and kept'
            ),
            'dryrun'       => new external_value(PARAM_BOOL, 'Whether this was a dry run'),
        ]);
    }

    /**
     * @param string[] $functions List of function names to sync.
     * @param bool     $dryrun    When true, compute diff without writing to DB.
     * @return array
     * @throws \moodle_exception
     */
    public static function execute(array $functions, bool $dryrun = false): array {
        global $DB;

        $params = self::validate_parameters(self::execute_parameters(), [
            'functions' => $functions,
            'dryrun'    => $dryrun,
        ]);

        $context = \context_system::instance();
        self::validate_context($context);
        require_capability('local/next_moodle:syncservice', $context);

        // Load the configured target service.
        $serviceId = (int) get_config('local_next_moodle', 'target_service_id');
        if (!$serviceId) {
            throw new \moodle_exception(
                'notconfigured',
                'local_next_moodle',
                new \moodle_url('/local/next_moodle/admin/configure.php')
            );
        }

        $service = $DB->get_record('external_services', ['id' => $serviceId], '*', MUST_EXIST);

        // Current functions on the service, keyed by function name.
        $currentRows     = $DB->get_records('external_services_functions', ['externalserviceid' => $serviceId]);
        $currentFunctions = [];
        foreach ($currentRows as $row) {
            $currentFunctions[] = $row->functionname;
        }

        $requestedFunctions = array_values(array_unique($params['functions']));

        // Validate that every requested function exists in the Moodle function registry.
        if (!empty($requestedFunctions)) {
            [$inSql, $inParams] = $DB->get_in_or_equal($requestedFunctions, SQL_PARAMS_NAMED, 'fn');
            $knownFunctions     = $DB->get_fieldset_select('external_functions', 'name', "name $inSql", $inParams);
            $unknown            = array_diff($requestedFunctions, $knownFunctions);
            if (!empty($unknown)) {
                throw new \moodle_exception(
                    'invalidfunctions',
                    'local_next_moodle',
                    '',
                    implode(', ', array_values($unknown))
                );
            }
        }

        $toAdd     = array_values(array_diff($requestedFunctions, $currentFunctions));
        // Never remove the sync function itself, even if the caller omits it.
        $toRemove  = array_values(array_diff($currentFunctions, $requestedFunctions, [self::SELF_FUNCTION]));
        $unchanged = array_values(array_intersect($requestedFunctions, $currentFunctions));

        if (!$params['dryrun']) {
            foreach ($toAdd as $fname) {
                $DB->insert_record('external_services_functions', [
                    'externalserviceid' => $serviceId,
                    'functionname'      => $fname,
                ]);
            }
            foreach ($toRemove as $fname) {
                $DB->delete_records('external_services_functions', [
                    'externalserviceid' => $serviceId,
                    'functionname'      => $fname,
                ]);
            }
        }

        return [
            'service_id'   => (int) $service->id,
            'service_name' => $service->name,
            'added'        => $toAdd,
            'removed'      => $toRemove,
            'unchanged'    => $unchanged,
            'dryrun'       => (bool) $params['dryrun'],
        ];
    }
}
