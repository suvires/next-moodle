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
 * Uninstall hook for local_next_moodle.
 *
 * Removes the configured target external service and all its function entries.
 * Plugin config is cleaned up automatically by Moodle core after this runs.
 *
 * @package   local_next_moodle
 * @copyright 2024 studiolxd
 * @license   https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Called just before the plugin's tables and capabilities are removed.
 */
function xmldb_local_next_moodle_uninstall(): bool {
    global $DB;

    $serviceId = (int) get_config('local_next_moodle', 'target_service_id');

    if ($serviceId > 0) {
        // Remove all tokens bound to this service first to avoid orphaned rows.
        $DB->delete_records('external_tokens', ['externalserviceid' => $serviceId]);

        // Remove all function entries for the service.
        $DB->delete_records('external_services_functions', ['externalserviceid' => $serviceId]);

        // Remove the service itself.
        $DB->delete_records('external_services', ['id' => $serviceId]);
    }

    return true;
}
