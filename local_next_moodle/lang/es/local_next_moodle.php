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
 * Spanish language strings for local_next_moodle.
 *
 * @package   local_next_moodle
 * @copyright 2024 studiolxd
 * @license   https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname']                   = 'Next Moodle';
$string['configure']                    = 'Configurar Next Moodle';
$string['settingssaved']                = 'Ajustes guardados.';
$string['currentservice']               = 'Servicio de destino configurado: <strong>{$a}</strong>';
$string['nosyncfunction']               = 'La función de sincronización <code>local_next_moodle_sync_service_functions</code> ha sido añadida al servicio de destino.';
$string['notconfigured']                = 'No se ha configurado ningún servicio de destino. Visita primero la página de ajustes del plugin.';
$string['invalidfunctions']             = 'Uno o más nombres de función no están registrados en esta instancia de Moodle: {$a}';
$string['selectservice']                = 'Seleccionar un servicio existente';
$string['orcreatenew']                  = 'o crear uno nuevo';
$string['newservicename']               = 'Nombre del nuevo servicio';
$string['newservicename_placeholder']   = 'Introduce un nombre para el nuevo servicio…';
$string['next_moodle:syncservice']      = 'Sincronizar funciones del servicio Next Moodle';
$string['serviceduplicatename']         = 'Ya existe un servicio con este nombre. Por favor elige un nombre diferente.';
$string['noserviceselected']            = 'Por favor selecciona un servicio existente o introduce un nombre para uno nuevo.';
