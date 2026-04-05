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
 * Form for configuring the target external service.
 *
 * @package   local_next_moodle
 * @copyright 2024 studiolxd
 * @license   https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_next_moodle\form;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/formslib.php');

/**
 * Allows the administrator to choose an existing external service or create a new one
 * to use as the target service for the Next.js application.
 */
class configure_form extends \moodleform {

    public function definition(): void {
        global $DB;

        $mform = $this->_form;

        // Build the list of existing external services.
        $services    = $DB->get_records('external_services', [], 'name ASC', 'id, name');
        $serviceopts = [];
        foreach ($services as $svc) {
            $serviceopts[$svc->id] = format_string($svc->name);
        }

        // Select existing service.
        $mform->addElement(
            'select',
            'target_service_id',
            get_string('selectservice', 'local_next_moodle'),
            $serviceopts
        );
        $mform->setType('target_service_id', PARAM_INT);

        // Visual separator.
        $mform->addElement(
            'html',
            '<div class="local-next-moodle-separator">'
            . '<span>' . get_string('orcreatenew', 'local_next_moodle') . '</span>'
            . '</div>'
        );

        // Create a new service.
        $mform->addElement(
            'text',
            'new_service_name',
            get_string('newservicename', 'local_next_moodle'),
            ['size' => 50, 'placeholder' => get_string('newservicename_placeholder', 'local_next_moodle')]
        );
        $mform->setType('new_service_name', PARAM_TEXT);

        $this->add_action_buttons(false, get_string('savechanges'));
    }

    public function validation($data, $files): array {
        global $DB;

        $errors = parent::validation($data, $files);

        $newName  = trim($data['new_service_name'] ?? '');
        $existing = (int) ($data['target_service_id'] ?? 0);

        if ($newName === '' && $existing <= 0) {
            $errors['target_service_id'] = get_string('noserviceselected', 'local_next_moodle');
        }

        if ($newName !== '') {
            if ($DB->record_exists('external_services', ['name' => $newName])) {
                $errors['new_service_name'] = get_string('serviceduplicatename', 'local_next_moodle');
            }
        }

        return $errors;
    }
}
