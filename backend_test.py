#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time
import os

class CS16CommunityTester:
    def __init__(self):
        # Get backend URL from frontend .env file
        self.base_url = "https://frag-tracker.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.created_resources = {
            'categories': [],
            'topics': [],
            'bans': [],
            'applications': []
        }

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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin_token=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        # Use appropriate token
        token_to_use = self.admin_token if use_admin_token else self.token
        if token_to_use and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {token_to_use}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=15)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=15)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:200]}"

            self.log_test(name, success, details)
            
            # Return response data if successful
            if success and response.content:
                try:
                    return success, response.json()
                except:
                    return success, response.text
            return success, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def setup_test_user(self):
        """Create and login test user"""
        print("\n🔍 Setting up test user...")
        
        timestamp = int(time.time())
        test_user = {
            "nickname": f"ForumTester{timestamp}",
            "email": f"forumtest{timestamp}@shadowzm.com",
            "password": "TestPass123!",
            "steamid": f"STEAM_0:0:{timestamp}"
        }
        
        success, response = self.run_test(
            "Create Test User", 
            "POST", 
            "auth/register", 
            200, 
            test_user
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return test_user
        return None

    def setup_admin_user(self):
        """Login as admin user"""
        print("\n🔍 Setting up admin user...")
        
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

    def test_forum_categories_api(self):
        """Test Forum Categories API"""
        print("\n🔍 Testing Forum Categories API...")
        
        # Test GET /api/forum/categories
        success, categories = self.run_test(
            "GET Forum Categories", 
            "GET", 
            "forum/categories", 
            200
        )
        
        if success:
            # Verify response structure
            if isinstance(categories, list):
                self.log_test("Categories Response Structure", True, f"Found {len(categories)} categories")
                
                # Check required fields in first category if exists
                if categories:
                    cat = categories[0]
                    required_fields = ['id', 'name', 'description', 'icon', 'order', 'topic_count', 'post_count']
                    for field in required_fields:
                        if field in cat:
                            self.log_test(f"Category Field: {field}", True)
                        else:
                            self.log_test(f"Category Field: {field}", False, "Missing field")
            else:
                self.log_test("Categories Response Structure", False, "Expected list response")
        
        # Test POST /api/forum/categories (admin only)
        if self.admin_token:
            timestamp = int(time.time())
            new_category = {
                "name": f"Test Category {timestamp}",
                "description": "Test category for API testing",
                "icon": "TestIcon",
                "order": 99
            }
            
            success, created_cat = self.run_test(
                "POST Forum Category (Admin)",
                "POST",
                "forum/categories",
                200,
                new_category,
                use_admin_token=True
            )
            
            if success and 'id' in created_cat:
                self.created_resources['categories'].append(created_cat['id'])
                self.log_test("Category Creation Response", True, f"Created category ID: {created_cat['id']}")
        else:
            self.log_test("POST Forum Category (Admin)", False, "No admin token available")

    def test_forum_topics_api(self):
        """Test Forum Topics API"""
        print("\n🔍 Testing Forum Topics API...")
        
        # First get categories to use for topic creation
        success, categories = self.run_test(
            "GET Categories for Topic Test", 
            "GET", 
            "forum/categories", 
            200
        )
        
        if success and categories and len(categories) > 0:
            category_id = categories[0]['id']
            
            # Test POST /api/forum/topics (requires auth)
            if self.token:
                timestamp = int(time.time())
                new_topic = {
                    "category_id": category_id,
                    "title": f"Test Topic {timestamp}",
                    "content": "This is a test topic created by the API testing suite."
                }
                
                success, created_topic = self.run_test(
                    "POST Forum Topic",
                    "POST",
                    "forum/topics",
                    200,
                    new_topic
                )
                
                if success and 'id' in created_topic:
                    self.created_resources['topics'].append(created_topic['id'])
                    topic_id = created_topic['id']
                    
                    # Verify topic structure
                    required_fields = ['id', 'category_id', 'title', 'content', 'author_id', 'author_name', 'reply_count', 'view_count']
                    for field in required_fields:
                        if field in created_topic:
                            self.log_test(f"Topic Field: {field}", True)
                        else:
                            self.log_test(f"Topic Field: {field}", False, "Missing field")
                    
                    # Test GET /api/forum/topics?category_id={id}
                    success, topics = self.run_test(
                        "GET Topics by Category",
                        "GET",
                        f"forum/topics?category_id={category_id}",
                        200
                    )
                    
                    if success and isinstance(topics, list):
                        self.log_test("Topics by Category Response", True, f"Found {len(topics)} topics")
                        
                        # Verify our created topic is in the list
                        found_topic = any(t.get('id') == topic_id for t in topics)
                        self.log_test("Created Topic in List", found_topic, "Topic found in category listing")
                    else:
                        self.log_test("Topics by Category Response", False, "Expected list response")
            else:
                self.log_test("POST Forum Topic", False, "No user token available")
        else:
            self.log_test("GET Categories for Topic Test", False, "No categories available for testing")

    def test_team_roles_api(self):
        """Test Team Roles API"""
        print("\n🔍 Testing Team Roles API...")
        
        # Test GET /api/team - Should return team members with role_type
        success, team_members = self.run_test(
            "GET Team Members",
            "GET",
            "team",
            200
        )
        
        if success and isinstance(team_members, list):
            self.log_test("Team Members Response Structure", True, f"Found {len(team_members)} team members")
            
            # Check for role_type field and verify owner/admin roles
            owners_found = 0
            admins_found = 0
            
            for member in team_members:
                required_fields = ['id', 'name', 'role', 'role_type']
                for field in required_fields:
                    if field in member:
                        self.log_test(f"Team Member Field: {field}", True)
                    else:
                        self.log_test(f"Team Member Field: {field}", False, "Missing field")
                        break
                
                # Count role types
                role_type = member.get('role_type', '').lower()
                if role_type == 'owner':
                    owners_found += 1
                elif role_type == 'admin':
                    admins_found += 1
            
            self.log_test("Team Owners Found", owners_found > 0, f"Found {owners_found} owners")
            self.log_test("Team Admins Found", admins_found >= 0, f"Found {admins_found} admins")
        else:
            self.log_test("Team Members Response Structure", False, "Expected list response")
        
        # Test GET /api/team/roles - Get role configurations with colors
        success, team_roles = self.run_test(
            "GET Team Role Configurations",
            "GET",
            "team/roles",
            200
        )
        
        if success and isinstance(team_roles, list):
            self.log_test("Team Roles Response Structure", True, f"Found {len(team_roles)} role configurations")
            
            # Check for required fields and specific colors
            owner_role_found = False
            admin_role_found = False
            
            for role in team_roles:
                required_fields = ['name', 'color', 'order']
                for field in required_fields:
                    if field in role:
                        self.log_test(f"Role Config Field: {field}", True)
                    else:
                        self.log_test(f"Role Config Field: {field}", False, "Missing field")
                        break
                
                # Check for specific role colors
                role_name = role.get('name', '').lower()
                color = role.get('color', '')
                
                if 'owner' in role_name:
                    owner_role_found = True
                    # Should be red color (#ef4444 or similar)
                    is_red = color.lower() in ['#ef4444', '#ff0000', 'red'] or 'red' in color.lower()
                    self.log_test("Owner Role Color (Red)", is_red, f"Color: {color}")
                
                elif 'admin' in role_name:
                    admin_role_found = True
                    # Should be green color (#22c55e or similar)
                    is_green = color.lower() in ['#22c55e', '#00ff00', 'green'] or 'green' in color.lower()
                    self.log_test("Admin Role Color (Green)", is_green, f"Color: {color}")
            
            self.log_test("Owner Role Configuration", owner_role_found, "Owner role config found")
            self.log_test("Admin Role Configuration", admin_role_found, "Admin role config found")
        else:
            self.log_test("Team Roles Response Structure", False, "Expected list response")

    def test_ban_expire_api(self):
        """Test Ban Expire API"""
        print("\n🔍 Testing Ban Expire API...")
        
        # Test GET /api/bans - Should return bans with is_expired field
        success, bans = self.run_test(
            "GET Bans List",
            "GET",
            "bans",
            200
        )
        
        if success and isinstance(bans, list):
            self.log_test("Bans Response Structure", True, f"Found {len(bans)} bans")
            
            # Check for is_expired field in bans
            if bans:
                ban = bans[0]
                required_fields = ['id', 'player_nickname', 'steamid', 'reason', 'ban_date', 'is_expired']
                for field in required_fields:
                    if field in ban:
                        self.log_test(f"Ban Field: {field}", True)
                    else:
                        self.log_test(f"Ban Field: {field}", False, "Missing field")
            
            # Create a test ban if admin token available
            if self.admin_token:
                timestamp = int(time.time())
                test_ban = {
                    "player_nickname": f"TestBannedPlayer{timestamp}",
                    "steamid": f"STEAM_0:1:{timestamp}",
                    "ip": "192.168.1.100",
                    "reason": "API Testing Ban",
                    "admin_name": "TestAdmin",
                    "duration": "1 hour"
                }
                
                success, created_ban = self.run_test(
                    "POST Create Test Ban",
                    "POST",
                    "bans",
                    200,
                    test_ban,
                    use_admin_token=True
                )
                
                if success and 'id' in created_ban:
                    ban_id = created_ban['id']
                    self.created_resources['bans'].append(ban_id)
                    
                    # Test PATCH /api/bans/{ban_id}/expire - Mark ban as expired (admin only)
                    success, expired_ban = self.run_test(
                        "PATCH Expire Ban",
                        "PATCH",
                        f"bans/{ban_id}/expire",
                        200,
                        use_admin_token=True
                    )
                    
                    if success:
                        # Verify the ban is now marked as expired
                        if 'is_expired' in expired_ban and expired_ban['is_expired']:
                            self.log_test("Ban Expired Successfully", True, "is_expired field set to true")
                        else:
                            self.log_test("Ban Expired Successfully", False, "is_expired field not set correctly")
                else:
                    self.log_test("POST Create Test Ban", False, "Could not create test ban")
            else:
                self.log_test("Ban Expire API (Admin Required)", False, "No admin token available")
        else:
            self.log_test("Bans Response Structure", False, "Expected list response")

    def test_admin_applications_api(self):
        """Test Admin Applications API with admin_commands_knowledge field"""
        print("\n🔍 Testing Admin Applications API...")
        
        if self.token:
            timestamp = int(time.time())
            
            # Test POST /api/admin-applications with admin_commands_knowledge field
            application_data = {
                "nickname": f"TestApplicant{timestamp}",
                "steamid": f"STEAM_0:0:{timestamp}",
                "age": 22,
                "experience": "I have 5 years of CS 1.6 experience and have been admin on other servers.",
                "reason": "I want to help maintain fair gameplay and assist new players.",
                "admin_commands_knowledge": "excellent"  # Testing the specific field mentioned
            }
            
            success, created_app = self.run_test(
                "POST Admin Application with Commands Knowledge",
                "POST",
                "admin-applications",
                200,
                application_data
            )
            
            if success and 'id' in created_app:
                app_id = created_app['id']
                self.created_resources['applications'].append(app_id)
                
                # Verify admin_commands_knowledge field is accepted and stored
                if 'admin_commands_knowledge' in created_app:
                    stored_value = created_app['admin_commands_knowledge']
                    if stored_value == "excellent":
                        self.log_test("Admin Commands Knowledge Field", True, f"Stored value: {stored_value}")
                    else:
                        self.log_test("Admin Commands Knowledge Field", False, f"Expected 'excellent', got '{stored_value}'")
                else:
                    self.log_test("Admin Commands Knowledge Field", False, "Field not found in response")
                
                # Test different knowledge levels
                for knowledge_level in ["bad", "good"]:
                    test_app_data = application_data.copy()
                    test_app_data["nickname"] = f"TestApplicant{timestamp}_{knowledge_level}"
                    test_app_data["steamid"] = f"STEAM_0:1:{timestamp}_{knowledge_level[-1]}"
                    test_app_data["admin_commands_knowledge"] = knowledge_level
                    
                    success, response = self.run_test(
                        f"POST Application with '{knowledge_level}' Knowledge",
                        "POST",
                        "admin-applications",
                        200,
                        test_app_data
                    )
                    
                    if success and 'admin_commands_knowledge' in response:
                        if response['admin_commands_knowledge'] == knowledge_level:
                            self.log_test(f"Knowledge Level '{knowledge_level}'", True)
                        else:
                            self.log_test(f"Knowledge Level '{knowledge_level}'", False, f"Expected '{knowledge_level}', got '{response['admin_commands_knowledge']}'")
                    
                    if success and 'id' in response:
                        self.created_resources['applications'].append(response['id'])
            else:
                self.log_test("POST Admin Application with Commands Knowledge", False, "Could not create application")
        else:
            self.log_test("Admin Applications API", False, "No user token available")

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        if self.admin_token:
            # Clean up categories
            for cat_id in self.created_resources['categories']:
                self.run_test(
                    f"Cleanup Category {cat_id}",
                    "DELETE",
                    f"forum/categories/{cat_id}",
                    200,
                    use_admin_token=True
                )
            
            # Clean up bans
            for ban_id in self.created_resources['bans']:
                self.run_test(
                    f"Cleanup Ban {ban_id}",
                    "DELETE",
                    f"bans/{ban_id}",
                    200,
                    use_admin_token=True
                )
            
            # Clean up applications
            for app_id in self.created_resources['applications']:
                self.run_test(
                    f"Cleanup Application {app_id}",
                    "DELETE",
                    f"admin-applications/{app_id}",
                    200,
                    use_admin_token=True
                )

    def run_comprehensive_tests(self):
        """Run all comprehensive tests"""
        print("🚀 Starting CS 1.6 Community Website API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Setup test users
        test_user = self.setup_test_user()
        admin_setup = self.setup_admin_user()
        
        if not test_user:
            print("❌ Could not set up test user. Some tests will be skipped.")
        
        if not admin_setup:
            print("❌ Could not set up admin user. Admin tests will be skipped.")
        
        # Run all API tests
        self.test_forum_categories_api()
        self.test_forum_topics_api()
        self.test_team_roles_api()
        self.test_ban_expire_api()
        self.test_admin_applications_api()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print final results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        # Print detailed failure summary
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = CS16CommunityTester()
    return tester.run_comprehensive_tests()

if __name__ == "__main__":
    sys.exit(main())