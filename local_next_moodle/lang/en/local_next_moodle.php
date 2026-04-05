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
 * English language strings for local_next_moodle.
 *
 * @package   local_next_moodle
 * @copyright 2024 studiolxd
 * @license   https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname']                   = 'Next Moodle';
$string['configure']                    = 'Configure Next Moodle';
$string['settingssaved']                = 'Settings saved.';
$string['currentservice']               = 'Currently configured target service: <strong>{$a}</strong>';
$string['nosyncfunction']               = 'The sync function <code>local_next_moodle_sync_service_functions</code> has been added to the target service.';
$string['notconfigured']                = 'No target service is configured. Visit the plugin settings page first.';
$string['invalidfunctions']             = 'One or more function names are not registered in this Moodle instance: {$a}';
$string['selectservice']                = 'Select an existing service';
$string['orcreatenew']                  = 'or create a new one';
$string['newservicename']               = 'New service name';
$string['newservicename_placeholder']   = 'Enter a name for the new service…';
$string['next_moodle:syncservice']      = 'Sync Next Moodle service functions';
$string['serviceduplicatename']         = 'A service with this name already exists. Please choose a different name.';
$string['noserviceselected']            = 'Please select an existing service or enter a name for a new one.';
