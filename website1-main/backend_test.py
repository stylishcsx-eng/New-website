#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class CS16ServerHubTester:
    def __init__(self, base_url="https://cs-server-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_basic_endpoints(self):
        """Test basic API endpoints"""
        print("\n🔍 Testing Basic Endpoints...")
        
        # Test root endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Test server status
        self.run_test("Server Status", "GET", "server-status", 200)
        
        # Test dashboard stats
        self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)
        
        # Test rankings
        self.run_test("Top Rankings", "GET", "rankings/top", 200)
        
        # Test bans list
        self.run_test("Bans List", "GET", "bans", 200)

    def test_user_registration(self):
        """Test user registration"""
        print("\n🔍 Testing User Registration...")
        
        timestamp = int(time.time())
        test_user = {
            "nickname": f"TestPlayer{timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPass123!",
            "steamid": f"STEAM_0:0:{timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration", 
            "POST", 
            "auth/register", 
            200, 
            test_user
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return test_user
        return None

    def test_user_login(self, user_data):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        if not user_data:
            self.log_test("User Login", False, "No user data available")
            return False
            
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        print("\n🔍 Testing Admin Login...")
        
        admin_data = {
            "username": "Stylish",
            "password": "Itachi1849"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/admin-login",
            200,
            admin_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            return True
        return False

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        print("\n🔍 Testing Admin Endpoints...")
        
        if not self.admin_token:
            self.log_test("Admin Endpoints", False, "No admin token available")
            return
        
        # Save current token and use admin token
        user_token = self.token
        self.token = self.admin_token
        
        # Test admin applications
        self.run_test("Admin Applications List", "GET", "admin-applications", 200)
        
        # Test admin users list
        self.run_test("Admin Users List", "GET", "admin/users", 200)
        
        # Test AMXBans status
        self.run_test("AMXBans Status", "GET", "bans/amxbans-status", 200)
        
        # Restore user token
        self.token = user_token

    def test_admin_application_flow(self):
        """Test admin application submission"""
        print("\n🔍 Testing Admin Application Flow...")
        
        timestamp = int(time.time())
        application_data = {
            "nickname": f"ApplicantTest{timestamp}",
            "steamid": f"STEAM_0:1:{timestamp}",
            "age": 25,
            "experience": "I have been playing CS 1.6 for over 10 years and have experience moderating other gaming communities.",
            "reason": "I want to help maintain fair gameplay and assist new players on the server."
        }
        
        success, response = self.run_test(
            "Submit Admin Application",
            "POST",
            "admin-applications",
            200,
            application_data
        )
        
        if success and 'id' in response:
            app_id = response['id']
            
            # Test duplicate application (should fail)
            self.run_test(
                "Duplicate Application (Should Fail)",
                "POST",
                "admin-applications",
                400,
                application_data
            )
            
            # Test admin approval (need admin token)
            if self.admin_token:
                user_token = self.token
                self.token = self.admin_token
                
                self.run_test(
                    "Approve Application",
                    "PATCH",
                    f"admin-applications/{app_id}",
                    200,
                    {"status": "approved"}
                )
                
                self.token = user_token

    def test_notifications(self):
        """Test notifications system"""
        print("\n🔍 Testing Notifications...")
        
        # Test getting notifications
        self.run_test("Get Notifications", "GET", "notifications", 200)

    def test_protected_endpoints_without_auth(self):
        """Test that protected endpoints require authentication"""
        print("\n🔍 Testing Protected Endpoints (No Auth)...")
        
        # Save token and clear it
        saved_token = self.token
        self.token = None
        
        # These should fail without authentication
        self.run_test("Admin Applications (No Auth)", "GET", "admin-applications", 401)
        self.run_test("Admin Users (No Auth)", "GET", "admin/users", 401)
        
        # Restore token
        self.token = saved_token

    def test_cs_server_integration(self):
        """Test CS 1.6 server integration"""
        print("\n🔍 Testing CS 1.6 Server Integration...")
        
        success, response = self.run_test("Server Status Query", "GET", "server-status", 200)
        
        if success:
            required_fields = ['online', 'server_name', 'server_ip', 'current_map', 'players_online', 'max_players']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Server Status Field: {field}", False, "Missing field")
                else:
                    self.log_test(f"Server Status Field: {field}", True)

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting CS 1.6 Server Hub API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test basic endpoints first
        self.test_basic_endpoints()
        
        # Test CS server integration
        self.test_cs_server_integration()
        
        # Test user registration and login
        user_data = self.test_user_registration()
        if user_data:
            self.test_user_login(user_data)
        
        # Test admin login
        self.test_admin_login()
        
        # Test admin endpoints
        self.test_admin_endpoints()
        
        # Test admin application flow
        self.test_admin_application_flow()
        
        # Test notifications
        self.test_notifications()
        
        # Test protected endpoints without auth
        self.test_protected_endpoints_without_auth()
        
        # Print final results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = CS16ServerHubTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())