/**
 * Simple Node.js test for Admin OTP Edge Function
 * Tests the function logic without requiring Supabase CLI
 */

const https = require('https');

const FUNCTION_URL = 'http://localhost:54321/functions/v1/admin-otp';
const TEST_EMAIL = 'leirs.admin@gmail.com';

let generatedOTP = null;

console.log('\n============================================================================');
console.log('                LEIRS ADMIN OTP - SIMPLIFIED TEST SUITE');
console.log('============================================================================\n');
console.log('⚠️  NOTE: This requires Supabase Edge Function to be running locally');
console.log('   Run in another terminal: npx -y supabase functions serve admin-otp\n');
console.log('Test Email:', TEST_EMAIL);
console.log('Function URL:', FUNCTION_URL);
console.log('\n');

// Test helper function
async function testAPI(testName, action, email, otp = null) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            action,
            email,
            ...(otp && { otp })
        });

        const options = {
            hostname: 'localhost',
            port: 54321,
            path: '/functions/v1/admin-otp',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = require('http').request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ success: true, status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ success: false, error: 'Failed to parse response', body });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ success: false, error: error.message });
        });

        req.write(data);
        req.end();
    });
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Run tests
(async () => {
    const results = [];

    try {
        // Test 1: Generate OTP
        console.log('TEST 1: Generate OTP');
        console.log('--------------------');
        const test1 = await testAPI('Generate OTP', 'generate', TEST_EMAIL);
        
        if (test1.success && test1.data.success && test1.data.dev_otp) {
            generatedOTP = test1.data.dev_otp;
            console.log('✅ PASS: OTP generated successfully');
            console.log('   OTP Code:', generatedOTP);
            console.log('   Expires In:', test1.data.expiresIn, 'seconds');
            console.log('   Remaining Requests:', test1.data.remaining);
            results.push({ test: 'Generate OTP', result: 'PASS' });
        } else {
            console.log('❌ FAIL:', test1.error || test1.data?.error || 'Unknown error');
            console.log('   Response:', JSON.stringify(test1, null, 2));
            results.push({ test: 'Generate OTP', result: 'FAIL' });
        }
        console.log('');
        await sleep(2000);

        // Test 2: Verify wrong OTP
        console.log('TEST 2: Verify WRONG OTP');
        console.log('-------------------------');
        const test2 = await testAPI('Verify Wrong OTP', 'verify', TEST_EMAIL, '999999');
        
        if (test2.success && !test2.data.success && test2.data.error === 'Incorrect OTP') {
            console.log('✅ PASS: Wrong OTP correctly rejected');
            console.log('   Attempts Left:', test2.data.attemptsLeft);
            results.push({ test: 'Verify Wrong OTP', result: 'PASS' });
        } else {
            console.log('❌ FAIL: Wrong OTP behavior incorrect');
            console.log('   Response:', JSON.stringify(test2, null, 2));
            results.push({ test: 'Verify Wrong OTP', result: 'FAIL' });
        }
        console.log('');
        await sleep(2000);

        // Test 3: Verify correct OTP
        console.log('TEST 3: Verify CORRECT OTP');
        console.log('---------------------------');
        const test3 = await testAPI('Verify Correct OTP', 'verify', TEST_EMAIL, generatedOTP);
        
        if (test3.success && test3.data.success) {
            console.log('✅ PASS: Correct OTP verified successfully');
            console.log('   Message:', test3.data.message);
            results.push({ test: 'Verify Correct OTP', result: 'PASS' });
        } else {
            console.log('❌ FAIL: Correct OTP was rejected');
            console.log('   Response:', JSON.stringify(test3, null, 2));
            results.push({ test: 'Verify Correct OTP', result: 'FAIL' });
        }
        console.log('');
        await sleep(2000);

        // Test 4: Verify OTP again (one-time use)
        console.log('TEST 4: Verify OTP Again (one-time use)');
        console.log('----------------------------------------');
        const test4 = await testAPI('Verify Again', 'verify', TEST_EMAIL, generatedOTP);
        
        if (test4.success && !test4.data.success && test4.data.error === 'No OTP found') {
            console.log('✅ PASS: OTP correctly deleted after first use');
            results.push({ test: 'One-Time Use', result: 'PASS' });
        } else {
            console.log('❌ FAIL: OTP can be reused (security issue!)');
            console.log('   Response:', JSON.stringify(test4, null, 2));
            results.push({ test: 'One-Time Use', result: 'FAIL' });
        }
        console.log('');
        await sleep(2000);

        // Test 5: Generate new OTP for resend test
        console.log('TEST 5: Generate New OTP for Resend');
        console.log('------------------------------------');
        const test5 = await testAPI('Generate Again', 'generate', TEST_EMAIL);
        
        if (test5.success && test5.data.success && test5.data.dev_otp) {
            generatedOTP = test5.data.dev_otp;
            console.log('✅ PASS: Second OTP generated');
            console.log('   New OTP Code:', generatedOTP);
            results.push({ test: 'Generate Second OTP', result: 'PASS' });
        } else {
            console.log('❌ FAIL: Second OTP generation failed');
            console.log('   Response:', JSON.stringify(test5, null, 2));
            results.push({ test: 'Generate Second OTP', result: 'FAIL' });
        }
        console.log('');
        await sleep(2000);

        // Test 6: Resend OTP
        console.log('TEST 6: Resend OTP');
        console.log('-------------------');
        const test6 = await testAPI('Resend OTP', 'resend', TEST_EMAIL);
        
        if (test6.success && test6.data.success) {
            console.log('✅ PASS: OTP resent successfully');
            console.log('   Resent OTP:', test6.data.dev_otp);
            console.log('   Same as before?', test6.data.dev_otp === generatedOTP ? 'Yes ✅' : 'No ❌');
            results.push({ test: 'Resend OTP', result: 'PASS' });
        } else {
            console.log('❌ FAIL: Resend failed');
            console.log('   Response:', JSON.stringify(test6, null, 2));
            results.push({ test: 'Resend OTP', result: 'FAIL' });
        }
        console.log('');

        // Summary
        console.log('============================================================================');
        console.log('                        TEST RESULTS SUMMARY');
        console.log('============================================================================\n');
        
        const passCount = results.filter(r => r.result === 'PASS').length;
        const failCount = results.filter(r => r.result === 'FAIL').length;
        
        results.forEach(r => {
            const icon = r.result === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${r.test}: ${r.result}`);
        });
        
        console.log('\nTotal Tests:', results.length);
        console.log('Passed:', passCount);
        console.log('Failed:', failCount);
        console.log('');
        
        if (failCount === 0) {
            console.log('============================================================================');
            console.log('              ✅ ALL TESTS PASSED - READY FOR STEP 2');
            console.log('============================================================================\n');
        } else {
            console.log('============================================================================');
            console.log('              ❌ SOME TESTS FAILED - REVIEW REQUIRED');
            console.log('============================================================================\n');
        }
        
    } catch (error) {
        console.log('\n❌ TEST ERROR:', error.message);
        console.log('\nMake sure the Supabase Edge Function is running locally!');
        console.log('Run: npx -y supabase functions serve admin-otp --env-file supabase/functions/.env.local\n');
    }
})();
