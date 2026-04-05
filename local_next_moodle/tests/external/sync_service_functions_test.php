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
 * PHPUnit tests for sync_service_functions external function.
 *
 * Run with:
 *   vendor/bin/phpunit local/next_moodle/tests/external/sync_service_functions_test.php
 *
 * @package   local_next_moodle
 * @copyright 2024 studiolxd
 * @license   https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_next_moodle\tests\external;

use advanced_testcase;
use local_next_moodle\external\sync_service_functions;
use moodle_exception;

/**
 * @covers \local_next_moodle\external\sync_service_functions
 */
class sync_service_functions_test extends advanced_testcase {

    /** @var int ID of the test target service. */
    private int $serviceId;

    /** @var string A real Moodle function we can use in tests. */
    private const REAL_FUNCTION = 'core_webservice_get_site_info';

    /** @var string Another real Moodle function. */
    private const REAL_FUNCTION_2 = 'core_enrol_get_users_courses';

    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest(true);

        global $DB;

        // Create a fresh external service to use as the target in each test.
        $this->serviceId = (int) $DB->insert_record('external_services', (object) [
            'name'            => 'Test Target Service',
            'shortname'       => null,
            'enabled'         => 1,
            'restrictedusers' => 0,
            'timecreated'     => time(),
            'timemodified'    => time(),
            'downloadfiles'   => 0,
            'uploadfiles'     => 0,
        ]);

        set_config('target_service_id', $this->serviceId, 'local_next_moodle');

        // Tests run as site admin so the capability check passes.
        $this->setAdminUser();
    }

    // -------------------------------------------------------------------------
    // Test 1: missing functions are added to the service.
    // -------------------------------------------------------------------------

    public function test_adds_missing_functions(): void {
        global $DB;

        $result = sync_service_functions::execute([self::REAL_FUNCTION], false);

        $this->assertContains(self::REAL_FUNCTION, $result['added'], 'Expected function to be added');
        $this->assertEmpty($result['removed'], 'No functions should be removed');
        $this->assertEmpty($result['unchanged'], 'No functions were already present');
        $this->assertFalse($result['dryrun']);
        $this->assertSame($this->serviceId, $result['service_id']);

        // Verify the row was actually written to the DB.
        $this->assertTrue(
            $DB->record_exists('external_services_functions', [
                'externalserviceid' => $this->serviceId,
                'functionname'      => self::REAL_FUNCTION,
            ]),
            'Row should be present in external_services_functions'
        );
    }

    // -------------------------------------------------------------------------
    // Test 2: extra functions are removed from the service.
    // -------------------------------------------------------------------------

    public function test_removes_extra_functions(): void {
        global $DB;

        // Pre-populate the service with a function.
        $DB->insert_record('external_services_functions', (object) [
            'externalserviceid' => $this->serviceId,
            'functionname'      => self::REAL_FUNCTION,
        ]);

        // Sync with an empty list: the pre-populated function should be removed.
        $result = sync_service_functions::execute([], false);

        $this->assertContains(self::REAL_FUNCTION, $result['removed'], 'Expected function to be removed');
        $this->assertEmpty($result['added']);
        $this->assertEmpty($result['unchanged']);

        // Verify the row was deleted from the DB.
        $this->assertFalse(
            $DB->record_exists('external_services_functions', [
                'externalserviceid' => $this->serviceId,
                'functionname'      => self::REAL_FUNCTION,
            ]),
            'Row should no longer exist in external_services_functions'
        );
    }

    // -------------------------------------------------------------------------
    // Test 3: functions already in the service are kept as "unchanged".
    // -------------------------------------------------------------------------

    public function test_unchanged_functions_stay(): void {
        global $DB;

        $DB->insert_record('external_services_functions', (object) [
            'externalserviceid' => $this->serviceId,
            'functionname'      => self::REAL_FUNCTION,
        ]);

        $result = sync_service_functions::execute([self::REAL_FUNCTION], false);

        $this->assertContains(self::REAL_FUNCTION, $result['unchanged']);
        $this->assertEmpty($result['added']);
        $this->assertEmpty($result['removed']);
    }

    // -------------------------------------------------------------------------
    // Test 4: dry run returns the correct diff without touching the DB.
    // -------------------------------------------------------------------------

    public function test_dryrun_does_not_apply_changes(): void {
        global $DB;

        $result = sync_service_functions::execute([self::REAL_FUNCTION], true);

        $this->assertTrue($result['dryrun']);
        $this->assertContains(self::REAL_FUNCTION, $result['added']);
        $this->assertEmpty($result['removed']);

        // The DB must be untouched.
        $this->assertFalse(
            $DB->record_exists('external_services_functions', [
                'externalserviceid' => $this->serviceId,
                'functionname'      => self::REAL_FUNCTION,
            ]),
            'Dry run must not write to the DB'
        );
    }

    // -------------------------------------------------------------------------
    // Test 5: the self-function is never removed even when omitted from the list.
    // -------------------------------------------------------------------------

    public function test_self_function_is_never_removed(): void {
        global $DB;

        $selfFn = sync_service_functions::SELF_FUNCTION;

        // Add the sync function itself to the service.
        $DB->insert_record('external_services_functions', (object) [
            'externalserviceid' => $this->serviceId,
            'functionname'      => $selfFn,
        ]);

        // Sync with a different function list that does NOT include the self function.
        $result = sync_service_functions::execute([self::REAL_FUNCTION], false);

        $this->assertNotContains($selfFn, $result['removed'], 'Self-function must never be removed');
        $this->assertTrue(
            $DB->record_exists('external_services_functions', [
                'externalserviceid' => $this->serviceId,
                'functionname'      => $selfFn,
            ]),
            'Self-function row should still exist after sync'
        );
    }

    // -------------------------------------------------------------------------
    // Test 6: exception when no target service is configured.
    // -------------------------------------------------------------------------

    public function test_throws_when_no_service_configured(): void {
        set_config('target_service_id', 0, 'local_next_moodle');

        $this->expectException(moodle_exception::class);
        sync_service_functions::execute([self::REAL_FUNCTION], false);
    }

    // -------------------------------------------------------------------------
    // Test 7: exception when function names are not registered in Moodle.
    // -------------------------------------------------------------------------

    public function test_throws_on_unknown_function_name(): void {
        $this->expectException(moodle_exception::class);
        sync_service_functions::execute(['this_function_absolutely_does_not_exist'], false);
    }

    // -------------------------------------------------------------------------
    // Test 8: add + remove in the same call.
    // -------------------------------------------------------------------------

    public function test_add_and_remove_in_same_call(): void {
        global $DB;

        // Pre-populate with REAL_FUNCTION_2.
        $DB->insert_record('external_services_functions', (object) [
            'externalserviceid' => $this->serviceId,
            'functionname'      => self::REAL_FUNCTION_2,
        ]);

        // Sync requesting REAL_FUNCTION (not REAL_FUNCTION_2).
        $result = sync_service_functions::execute([self::REAL_FUNCTION], false);

        $this->assertContains(self::REAL_FUNCTION, $result['added']);
        $this->assertContains(self::REAL_FUNCTION_2, $result['removed']);
        $this->assertEmpty($result['unchanged']);

        $this->assertTrue($DB->record_exists('external_services_functions', [
            'externalserviceid' => $this->serviceId,
            'functionname'      => self::REAL_FUNCTION,
        ]));
        $this->assertFalse($DB->record_exists('external_services_functions', [
            'externalserviceid' => $this->serviceId,
            'functionname'      => self::REAL_FUNCTION_2,
        ]));
    }
}
