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
 * Admin settings entry point for local_next_moodle.
 *
 * @package   local_next_moodle
 * @copyright 2024 studiolxd
 * @license   https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $ADMIN->add(
        'localplugins',
        new admin_externalpage(
            'local_next_moodle_configure',
            get_string('pluginname', 'local_next_moodle'),
            new moodle_url('/local/next_moodle/admin/configure.php'),
            'moodle/site:config'
        )
    );

    // After fresh install or when the plugin has never been configured, redirect
    // the admin straight to the configuration page. The needs_setup flag is set
    // by db/install.php and cleared once the admin saves a service selection.
    if (get_config('local_next_moodle', 'needs_setup')) {
        redirect(new moodle_url('/local/next_moodle/admin/configure.php'));
    }
}
