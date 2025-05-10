export function validateEnv() {
    const requiredVars = [
        'PORT',
        'MONGO_URI',
        'GEMINI_API_KEY',
        'HUAWEI_MODEL_API_URL',
        'HUAWEI_MODEL_SDK_AK',
        'HUAWEI_MODEL_SDK_SK',
        'HUAWEI_PREDICTION_MODEL_URL',
        'DEEPSEEK_API_KEY',
        'OBS_AK',
        'OBS_SK',
        'OBS_ENDPOINT',
        'OBS_BUCKET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('Missing required environment variables:');
        missingVars.forEach(varName => console.error(`- ${varName}`));
        process.exit(1);
    }

    console.log('Environment variables validated successfully');
}



