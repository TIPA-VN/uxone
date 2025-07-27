# Admin Fallback Authentication System

## Overview

This system provides a secure fallback authentication mechanism for admin accounts when the central authentication API is unavailable. This ensures that critical system administration can continue even during central service outages.

## How It Works

### 1. **Automatic Detection**
- The system automatically checks if the central authentication API is available
- If the central API is down, it switches to local admin authentication
- Only admin accounts can authenticate during fallback mode

### 2. **Fallback Authentication Flow**
```
1. User attempts to login
2. System checks central API health
3. If central API is down:
   - Only admin credentials are accepted
   - Local admin user is created/updated in database
   - User is authenticated with fallback flag
4. If central API is up:
   - Normal authentication proceeds
   - All users can authenticate normally
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Admin Fallback Credentials
ADMIN_FALLBACK_USERNAME=admin
ADMIN_FALLBACK_PASSWORD=your_secure_password
ADMIN_FALLBACK_HASHED_PASSWORD=$2a$12$...  # Generated hash
ADMIN_FALLBACK_ROLE=GENERAL DIRECTOR
ADMIN_FALLBACK_NAME=System Administrator
ADMIN_FALLBACK_EMAIL=admin@tipa.co.th
ADMIN_FALLBACK_DEPARTMENT=IT
ADMIN_FALLBACK_DEPARTMENT_NAME=Information Technology
```

### Generate Hashed Password

Use the utility script to generate a secure hashed password:

```bash
node scripts/generate-admin-password.js your_secure_password
```

## Security Features

### 1. **Automatic Fallback Detection**
- 5-second timeout for central API health checks
- Automatic switching between normal and fallback modes
- No manual intervention required

### 2. **Admin-Only Access During Fallback**
- Only admin credentials work when central API is down
- Regular users cannot authenticate during fallback mode
- Clear error messages inform users of service unavailability

### 3. **Secure Password Storage**
- Passwords are hashed using bcrypt with 12 salt rounds
- Environment variables for secure credential storage
- No hardcoded credentials in code

### 4. **Session Management**
- Fallback authentication sessions are marked with `isFallbackAuth: true`
- Normal authentication sessions are marked with `isFallbackAuth: false`
- Sessions work normally regardless of authentication method

## Usage

### Normal Operation
When the central API is available:
- All users can authenticate normally
- Central API handles all authentication
- Local database is updated with user information

### Fallback Operation
When the central API is unavailable:
- Only admin accounts can authenticate
- Admin user is created/updated in local database
- System continues to function with admin access

### Monitoring Fallback Status

You can check if a user authenticated via fallback:

```typescript
import { useSession } from 'next-auth/react'

function AdminComponent() {
  const { data: session } = useSession()
  
  if (session?.user?.isFallbackAuth) {
    console.log('User authenticated via fallback')
    // Show fallback warning or additional security measures
  }
}
```

## API Endpoints

### Health Check
- **GET** `/api/auth/health`
- Returns central API status
- Used for automatic fallback detection

### Authentication
- **POST** `/api/auth/login` (central API)
- **POST** `/api/auth/signin` (NextAuth endpoint)

## Troubleshooting

### Common Issues

1. **Fallback not working**
   - Check environment variables are set correctly
   - Verify hashed password is generated properly
   - Check central API health endpoint

2. **Central API timeout**
   - Adjust timeout in `isCentralApiAvailable()` function
   - Check network connectivity to central API

3. **Admin credentials not working**
   - Verify username/password match environment variables
   - Check if hashed password is set correctly
   - Ensure admin role has proper permissions

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will show:
- Central API availability status
- Fallback authentication attempts
- User creation/update operations

## Best Practices

1. **Regular Password Rotation**
   - Change admin fallback password regularly
   - Use strong, unique passwords
   - Generate new hashed passwords when changing

2. **Environment Security**
   - Store credentials in secure environment variables
   - Never commit credentials to version control
   - Use different credentials for different environments

3. **Monitoring**
   - Monitor fallback authentication usage
   - Set up alerts for extended fallback periods
   - Log all fallback authentication attempts

4. **Testing**
   - Test fallback authentication regularly
   - Simulate central API outages
   - Verify admin access works during fallback

## Emergency Procedures

### If Fallback Authentication Fails

1. **Check Environment Variables**
   ```bash
   # Verify all required variables are set
   echo $ADMIN_FALLBACK_USERNAME
   echo $ADMIN_FALLBACK_PASSWORD
   echo $ADMIN_FALLBACK_HASHED_PASSWORD
   ```

2. **Regenerate Admin Password**
   ```bash
   node scripts/generate-admin-password.js new_password
   ```

3. **Restart Application**
   ```bash
   npm run dev
   # or
   npm run build && npm start
   ```

### If Central API is Permanently Down

1. **Temporary Solution**: Use fallback authentication
2. **Long-term Solution**: Implement local authentication for all users
3. **Recovery**: Restore central API connectivity

## Security Considerations

- **Limited Access**: Only admin accounts work during fallback
- **Temporary Solution**: Fallback is designed for emergency use only
- **Audit Trail**: All fallback authentications are logged
- **Session Security**: Sessions work normally regardless of auth method
- **No Data Loss**: User data is preserved in local database 