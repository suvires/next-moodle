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
 * Web service function definitions for local_next_moodle.
 *
 * @package   local_next_moodle
 * @copyright 2024 studiolxd
 * @license   https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_next_moodle_sync_service_functions' => [
        'classname'     => 'local_next_moodle\external\sync_service_functions',
        'methodname'    => 'execute',
        'description'   => 'Syncs a list of function names to the configured target external service, '
                         . 'adding missing functions and removing those no longer needed.',
        'type'          => 'write',
        'capabilities'  => 'local/next_moodle:syncservice',
        'ajax'          => false,
        'loginrequired' => true,
    ],
];
