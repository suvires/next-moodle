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
 * Admin configuration page for local_next_moodle.
 *
 * Allows administrators to select or create the target external service and
 * automatically adds the sync function to it.
 *
 * @package   local_next_moodle
 * @copyright 2024 studiolxd
 * @license   https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/adminlib.php');

require_login();

$context = context_system::instance();
require_capability('moodle/site:config', $context);

$PAGE->set_url(new moodle_url('/local/next_moodle/admin/configure.php'));
$PAGE->set_context($context);
$PAGE->set_title(get_string('configure', 'local_next_moodle'));
$PAGE->set_heading(get_string('configure', 'local_next_moodle'));
$PAGE->set_pagelayout('admin');

$form = new \local_next_moodle\form\configure_form();

if ($data = $form->get_data()) {
    $newName   = trim($data->new_service_name ?? '');
    $serviceId = 0;

    if ($newName !== '') {
        // Create a new external service.
        $serviceId = $DB->insert_record('external_services', (object) [
            'name'            => $newName,
            'shortname'       => null,
            'enabled'         => 1,
            'restrictedusers' => 0,
            'timecreated'     => time(),
            'timemodified'    => time(),
            'component'       => null,
            'downloadfiles'   => 0,
            'uploadfiles'     => 0,
        ]);
    } else {
        $serviceId = (int) $data->target_service_id;
    }

    set_config('target_service_id', $serviceId, 'local_next_moodle');

    // Auto-add the sync function to the target service if not already present.
    $syncFunction = 'local_next_moodle_sync_service_functions';
    if (!$DB->record_exists('external_services_functions', [
        'externalserviceid' => $serviceId,
        'functionname'      => $syncFunction,
    ])) {
        $DB->insert_record('external_services_functions', (object) [
            'externalserviceid' => $serviceId,
            'functionname'      => $syncFunction,
        ]);
    }

    // Clear the first-time setup flag set by db/install.php.
    unset_config('needs_setup', 'local_next_moodle');

    redirect(
        $PAGE->url,
        get_string('settingssaved', 'local_next_moodle'),
        null,
        \core\output\notification::NOTIFY_SUCCESS
    );
}

// Pre-populate the form with the currently saved service ID.
$currentServiceId = (int) get_config('local_next_moodle', 'target_service_id');
if ($currentServiceId > 0) {
    $form->set_data(['target_service_id' => $currentServiceId]);
}

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('configure', 'local_next_moodle'));

// Show currently configured service.
if ($currentServiceId > 0) {
    $currentService = $DB->get_record('external_services', ['id' => $currentServiceId]);
    if ($currentService) {
        echo $OUTPUT->notification(
            get_string('currentservice', 'local_next_moodle', s($currentService->name)),
            \core\output\notification::NOTIFY_INFO
        );
    }
}

$form->display();

echo $OUTPUT->footer();
