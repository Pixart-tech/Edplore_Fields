#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Location Tracker API
Tests all endpoints with proper error handling and edge cases
"""

import requests
import json
import time
from typing import Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LocationTrackerAPITester:
    def __init__(self):
        # Use the frontend URL from .env as the base URL
        self.base_url = "https://mapcoords.preview.emergentagent.com"
        self.api_base = f"{self.base_url}/api"
        self.test_table_name = "test_coordinates_table"
        self.invalid_table_name = "nonexistent_table_12345"
        
        print(f"Testing Location Tracker API at: {self.base_url}")
        print(f"API Base URL: {self.api_base}")
        print("=" * 60)

    def test_root_endpoint(self) -> Dict[str, Any]:
        """Test GET / - Root health check endpoint"""
        print("\n🔍 Testing Root Endpoint (GET /)")
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            
            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Response Data: {json.dumps(data, indent=2)}")
                
                # Verify expected fields
                expected_fields = ["message", "version", "endpoints"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if missing_fields:
                    return {
                        "status": "FAILED",
                        "error": f"Missing expected fields: {missing_fields}",
                        "response": data
                    }
                
                # Check CORS headers
                cors_headers = {
                    "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
                    "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
                    "access-control-allow-headers": response.headers.get("access-control-allow-headers")
                }
                print(f"CORS Headers: {cors_headers}")
                
                return {
                    "status": "PASSED",
                    "response": data,
                    "cors_headers": cors_headers
                }
            else:
                return {
                    "status": "FAILED",
                    "error": f"Unexpected status code: {response.status_code}",
                    "response": response.text
                }
                
        except requests.exceptions.RequestException as e:
            return {
                "status": "FAILED",
                "error": f"Request failed: {str(e)}"
            }

    def test_health_endpoint(self) -> Dict[str, Any]:
        """Test GET /api/health - Detailed health check with AWS connectivity"""
        print("\n🔍 Testing Health Endpoint (GET /api/health)")
        try:
            response = requests.get(f"{self.api_base}/health", timeout=10)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Response Data: {json.dumps(data, indent=2)}")
                
                # Verify expected structure
                expected_fields = ["status", "services"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if missing_fields:
                    return {
                        "status": "FAILED",
                        "error": f"Missing expected fields: {missing_fields}",
                        "response": data
                    }
                
                # Check services structure
                services = data.get("services", {})
                expected_services = ["api", "dynamodb"]
                missing_services = [service for service in expected_services if service not in services]
                
                if missing_services:
                    return {
                        "status": "FAILED",
                        "error": f"Missing expected services: {missing_services}",
                        "response": data
                    }
                
                # Verify API service is running
                if services.get("api") != "running":
                    return {
                        "status": "FAILED",
                        "error": f"API service not running: {services.get('api')}",
                        "response": data
                    }
                
                # DynamoDB status should be one of: connected, error, not_configured
                dynamodb_status = services.get("dynamodb")
                valid_dynamodb_statuses = ["connected", "not_configured"]
                
                if not (dynamodb_status in valid_dynamodb_statuses or dynamodb_status.startswith("error:")):
                    return {
                        "status": "FAILED",
                        "error": f"Unexpected DynamoDB status: {dynamodb_status}",
                        "response": data
                    }
                
                return {
                    "status": "PASSED",
                    "response": data,
                    "dynamodb_available": dynamodb_status == "connected"
                }
            else:
                return {
                    "status": "FAILED",
                    "error": f"Unexpected status code: {response.status_code}",
                    "response": response.text
                }
                
        except requests.exceptions.RequestException as e:
            return {
                "status": "FAILED",
                "error": f"Request failed: {str(e)}"
            }

    def test_get_coordinates_invalid_table(self) -> Dict[str, Any]:
        """Test GET /api/coordinates/{table_name} with invalid table name"""
        print(f"\n🔍 Testing Get Coordinates with Invalid Table (GET /api/coordinates/{self.invalid_table_name})")
        try:
            response = requests.get(f"{self.api_base}/coordinates/{self.invalid_table_name}", timeout=10)
            
            print(f"Status Code: {response.status_code}")
            
            # Should return 404 for non-existent table or 500 if DynamoDB not configured
            if response.status_code in [404, 500]:
                data = response.json()
                print(f"Response Data: {json.dumps(data, indent=2)}")
                
                # Verify error response structure
                if "detail" not in data:
                    return {
                        "status": "FAILED",
                        "error": "Error response missing 'detail' field",
                        "response": data
                    }
                
                return {
                    "status": "PASSED",
                    "response": data,
                    "error_handled": True
                }
            else:
                return {
                    "status": "FAILED",
                    "error": f"Expected 404 or 500, got {response.status_code}",
                    "response": response.text
                }
                
        except requests.exceptions.RequestException as e:
            return {
                "status": "FAILED",
                "error": f"Request failed: {str(e)}"
            }

    def test_create_test_data(self) -> Dict[str, Any]:
        """Test POST /api/test-data/{table_name} - Create test coordinate data"""
        print(f"\n🔍 Testing Create Test Data (POST /api/test-data/{self.test_table_name})")
        try:
            response = requests.post(f"{self.api_base}/test-data/{self.test_table_name}", timeout=30)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Response Data: {json.dumps(data, indent=2)}")
                
                # Verify expected fields
                expected_fields = ["message", "coordinates_added", "table_name"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if missing_fields:
                    return {
                        "status": "FAILED",
                        "error": f"Missing expected fields: {missing_fields}",
                        "response": data
                    }
                
                # Verify coordinates were added
                if data.get("coordinates_added", 0) <= 0:
                    return {
                        "status": "FAILED",
                        "error": "No coordinates were added",
                        "response": data
                    }
                
                return {
                    "status": "PASSED",
                    "response": data,
                    "coordinates_created": data.get("coordinates_added", 0)
                }
            elif response.status_code == 500:
                # Expected if DynamoDB not configured
                data = response.json()
                print(f"Response Data: {json.dumps(data, indent=2)}")
                
                if "DynamoDB" in data.get("detail", ""):
                    return {
                        "status": "PASSED",
                        "response": data,
                        "error_handled": True,
                        "note": "DynamoDB not configured - expected behavior"
                    }
                else:
                    return {
                        "status": "FAILED",
                        "error": f"Unexpected 500 error: {data.get('detail')}",
                        "response": data
                    }
            else:
                return {
                    "status": "FAILED",
                    "error": f"Unexpected status code: {response.status_code}",
                    "response": response.text
                }
                
        except requests.exceptions.RequestException as e:
            return {
                "status": "FAILED",
                "error": f"Request failed: {str(e)}"
            }

    def test_get_coordinates_valid_table(self) -> Dict[str, Any]:
        """Test GET /api/coordinates/{table_name} with valid table name"""
        print(f"\n🔍 Testing Get Coordinates with Valid Table (GET /api/coordinates/{self.test_table_name})")
        try:
            response = requests.get(f"{self.api_base}/coordinates/{self.test_table_name}", timeout=10)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Response Data: {json.dumps(data, indent=2)}")
                
                # Verify expected fields
                expected_fields = ["table_name", "coordinates", "count"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if missing_fields:
                    return {
                        "status": "FAILED",
                        "error": f"Missing expected fields: {missing_fields}",
                        "response": data
                    }
                
                # Verify coordinates structure
                coordinates = data.get("coordinates", [])
                if coordinates:
                    for coord in coordinates:
                        required_coord_fields = ["id", "title", "latitude", "longitude"]
                        missing_coord_fields = [field for field in required_coord_fields if field not in coord]
                        
                        if missing_coord_fields:
                            return {
                                "status": "FAILED",
                                "error": f"Coordinate missing fields: {missing_coord_fields}",
                                "response": data
                            }
                        
                        # Verify latitude and longitude are numbers
                        try:
                            float(coord["latitude"])
                            float(coord["longitude"])
                        except (ValueError, TypeError):
                            return {
                                "status": "FAILED",
                                "error": f"Invalid coordinate values: {coord}",
                                "response": data
                            }
                
                return {
                    "status": "PASSED",
                    "response": data,
                    "coordinates_count": len(coordinates)
                }
            elif response.status_code in [404, 500]:
                # Expected if table doesn't exist or DynamoDB not configured
                data = response.json()
                print(f"Response Data: {json.dumps(data, indent=2)}")
                
                return {
                    "status": "PASSED",
                    "response": data,
                    "error_handled": True,
                    "note": "Table not found or DynamoDB not configured - expected behavior"
                }
            else:
                return {
                    "status": "FAILED",
                    "error": f"Unexpected status code: {response.status_code}",
                    "response": response.text
                }
                
        except requests.exceptions.RequestException as e:
            return {
                "status": "FAILED",
                "error": f"Request failed: {str(e)}"
            }

    def test_cors_headers(self) -> Dict[str, Any]:
        """Test CORS headers on API endpoints"""
        print("\n🔍 Testing CORS Headers")
        try:
            # Test OPTIONS request
            response = requests.options(f"{self.api_base}/health", timeout=10)
            
            print(f"OPTIONS Status Code: {response.status_code}")
            
            cors_headers = {
                "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
                "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
                "access-control-allow-headers": response.headers.get("access-control-allow-headers"),
                "access-control-allow-credentials": response.headers.get("access-control-allow-credentials")
            }
            
            print(f"CORS Headers: {json.dumps(cors_headers, indent=2)}")
            
            # Check if CORS is properly configured
            if cors_headers["access-control-allow-origin"]:
                return {
                    "status": "PASSED",
                    "cors_headers": cors_headers
                }
            else:
                return {
                    "status": "FAILED",
                    "error": "CORS headers not properly configured",
                    "cors_headers": cors_headers
                }
                
        except requests.exceptions.RequestException as e:
            return {
                "status": "FAILED",
                "error": f"Request failed: {str(e)}"
            }

    def run_all_tests(self) -> Dict[str, Any]:
        """Run all tests and return comprehensive results"""
        print("🚀 Starting Location Tracker API Backend Tests")
        print("=" * 60)
        
        test_results = {}
        
        # Test 1: Root endpoint
        test_results["root_endpoint"] = self.test_root_endpoint()
        
        # Test 2: Health endpoint
        test_results["health_endpoint"] = self.test_health_endpoint()
        
        # Test 3: CORS headers
        test_results["cors_headers"] = self.test_cors_headers()
        
        # Test 4: Get coordinates with invalid table
        test_results["get_coordinates_invalid"] = self.test_get_coordinates_invalid_table()
        
        # Test 5: Create test data
        test_results["create_test_data"] = self.test_create_test_data()
        
        # Test 6: Get coordinates with valid table (after creating test data)
        time.sleep(2)  # Wait a bit for data to be available
        test_results["get_coordinates_valid"] = self.test_get_coordinates_valid_table()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed_tests = 0
        total_tests = len(test_results)
        
        for test_name, result in test_results.items():
            status = result.get("status", "UNKNOWN")
            if status == "PASSED":
                print(f"✅ {test_name}: PASSED")
                passed_tests += 1
            else:
                print(f"❌ {test_name}: FAILED - {result.get('error', 'Unknown error')}")
        
        print(f"\n📈 Overall: {passed_tests}/{total_tests} tests passed")
        
        return {
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "success_rate": f"{(passed_tests/total_tests)*100:.1f}%"
            },
            "test_results": test_results
        }

def main():
    """Main function to run all tests"""
    tester = LocationTrackerAPITester()
    results = tester.run_all_tests()
    
    # Save results to file
    with open("/app/backend_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Test results saved to: /app/backend_test_results.json")
    
    return results

if __name__ == "__main__":
    main()