/**
 * JWT Authentication Test Examples
 * 
 * This file contains examples of how to test the JWT authentication endpoints
 * You can run these tests using any HTTP client (curl, Postman, Thunder Client, etc.)
 */

// Base URL
const BASE_URL = 'http://localhost:8000';

/**
 * Example 1: Register a new user
 */
async function testRegister() {
    const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            password: 'securepass123',
            phone: '+1234567890'
        })
    });

    const data = await response.json();
    console.log('Register Response:', data);

    if (data.success) {
        // Save tokens for later use
        return {
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            user: data.data.user
        };
    }

    return null;
}

/**
 * Example 2: Login
 */
async function testLogin() {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: 'john.doe@example.com',
            password: 'securepass123'
        })
    });

    const data = await response.json();
    console.log('Login Response:', data);

    if (data.success) {
        return {
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
            user: data.data.user
        };
    }

    return null;
}

/**
 * Example 3: Get user profile (protected route)
 */
async function testGetProfile(accessToken: string) {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    });

    const data = await response.json();
    console.log('Profile Response:', data);
    return data;
}

/**
 * Example 4: Refresh access token
 */
async function testRefreshToken(refreshToken: string) {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            refreshToken: refreshToken
        })
    });

    const data = await response.json();
    console.log('Refresh Token Response:', data);

    if (data.success) {
        return data.data.accessToken;
    }

    return null;
}

/**
 * Example 5: Get active sessions
 */
async function testGetSessions(accessToken: string) {
    const response = await fetch(`${BASE_URL}/auth/sessions`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    });

    const data = await response.json();
    console.log('Sessions Response:', data);
    return data;
}

/**
 * Example 6: Logout from current session
 */
async function testLogout(accessToken: string) {
    const response = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    });

    const data = await response.json();
    console.log('Logout Response:', data);
    return data;
}

/**
 * Example 7: Logout from all sessions
 */
async function testLogoutAll(accessToken: string) {
    const response = await fetch(`${BASE_URL}/auth/logout-all`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    });

    const data = await response.json();
    console.log('Logout All Response:', data);
    return data;
}

/**
 * Example 8: Revoke a specific session
 */
async function testRevokeSession(accessToken: string, sessionId: number) {
    const response = await fetch(`${BASE_URL}/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        }
    });

    const data = await response.json();
    console.log('Revoke Session Response:', data);
    return data;
}

/**
 * Run all tests in sequence
 */
async function runAllTests() {
    console.log('=== Starting JWT Auth Tests ===\n');

    try {
        // Test 1: Register
        console.log('1. Testing Registration...');
        const registerResult = await testRegister();
        if (!registerResult) {
            console.log('Registration failed, trying login instead...');
            const loginResult = await testLogin();
            if (!loginResult) {
                console.error('Both registration and login failed!');
                return;
            }
            var { accessToken, refreshToken } = loginResult;
        } else {
            var { accessToken, refreshToken } = registerResult;
        }
        console.log('\n');

        // Test 2: Get Profile
        console.log('2. Testing Get Profile...');
        await testGetProfile(accessToken);
        console.log('\n');

        // Test 3: Get Sessions
        console.log('3. Testing Get Sessions...');
        await testGetSessions(accessToken);
        console.log('\n');

        // Test 4: Refresh Token
        console.log('4. Testing Refresh Token...');
        const newAccessToken = await testRefreshToken(refreshToken);
        if (newAccessToken) {
            accessToken = newAccessToken;
        }
        console.log('\n');

        // Test 5: Logout
        console.log('5. Testing Logout...');
        await testLogout(accessToken);
        console.log('\n');

        console.log('=== All Tests Completed ===');
    } catch (error) {
        console.error('Test Error:', error);
    }
}

// Export for use in other files
export {
    testRegister,
    testLogin,
    testGetProfile,
    testRefreshToken,
    testGetSessions,
    testLogout,
    testLogoutAll,
    testRevokeSession,
    runAllTests
};

// Uncomment to run tests when this file is executed
// runAllTests();
