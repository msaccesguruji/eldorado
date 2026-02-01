const { Amplify } = require('aws-amplify');
const { signIn, fetchAuthSession } = require('aws-amplify/auth');

module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username, password, poolId, clientId } = req.body;

    // Configure Amplify dynamically based on request
    Amplify.configure({
        Auth: {
            Cognito: {
                userPoolId: poolId,
                userPoolClientId: clientId
            }
        }
    });

    try {
        const { isSignedIn, nextStep } = await signIn({ 
            username, 
            password 
        });

        if (!isSignedIn) {
            return res.status(401).json({ 
                success: false, 
                step: nextStep.signInStep,
                message: "Challenge required (MFA or New Password)" 
            });
        }

        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        const refreshToken = session.tokens?.refreshToken?.toString();

        return res.status(200).json({
            success: true,
            idToken,
            refreshToken
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            error: error.name, 
            message: error.message 
        });
    }
};
