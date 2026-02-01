const { Amplify } = require('aws-amplify');
const { signIn, fetchAuthSession } = require('aws-amplify/auth');

export default async function handler(req, res) {
    // 1. Enable CORS so Apps Script can talk to it
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username, password, poolId, clientId } = req.body;

    if (!username || !password || !poolId || !clientId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    // 2. Configure Amplify
    Amplify.configure({
        Auth: {
            Cognito: {
                userPoolId: poolId,
                userPoolClientId: clientId
            }
        }
    });

    try {
        // 3. Attempt Sign In
        const { isSignedIn, nextStep } = await signIn({ username, password });

        if (!isSignedIn) {
            return res.status(401).json({ 
                success: false, 
                nextStep: nextStep.signInStep,
                message: "Authentication challenge required (MFA or Password Change)." 
            });
        }

        // 4. Get Tokens
        const session = await fetchAuthSession();
        return res.status(200).json({
            success: true,
            idToken: session.tokens?.idToken?.toString(),
            refreshToken: session.tokens?.refreshToken?.toString()
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error.name, 
            message: error.message 
        });
    }
}
