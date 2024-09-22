#!/bin/bash

# 1. Sign into the Twitch Developer console:
# https://dev.twitch.tv/console/apps/create

# 2. Fill out the form to create your app as such:
# Name: [whatever you want to call the app]
# OAuth Redirect URLs: https://localhost
# Category: Pick what you feel is best for your project
# Client Type: Confidential

# 3. Click the [Create] button.  You'll be taken back to the list of your apps.

# 4. Click "Manage" and get the Client ID and Secret for your newly created app.

# 5. Fill in the CLIENT_ID and CLIENT_SECRET values with your app's values.

# 6. Save and run this script to get your token values.

# Set your credentials and redirect URI
CLIENT_ID="le7abjj3rwkw8uztmaz24oitu7dl0w"
CLIENT_SECRET="osy0z74x8sgox1xdcbwzf4h2sw3e00"
REDIRECT_URI="https://localhost"
SCOPES="chat:read+chat:edit" # Add any other scopes here

# Step 1: Generate the authorization URL
echo "Visit this URL to authorize:"
echo "https://id.twitch.tv/oauth2/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&response_type=code&scope=$SCOPES"

# Step 2: Ask the user to paste the entire redirect URL
read -p "Paste the entire redirect URL from the browser here: " REDIRECT_URL

# Step 3: Extract the authorization code from the redirect URL
AUTH_CODE=$(echo $REDIRECT_URL | grep -o 'code=[^&]*' | cut -d '=' -f 2)

if [ -z "$AUTH_CODE" ]; then
    echo "Failed to extract the authorization code. Please check the redirect URL."
    exit 1
fi

# Step 4: Exchange the authorization code for access and refresh tokens
RESPONSE=$(curl -s -X POST "https://id.twitch.tv/oauth2/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "client_id=$CLIENT_ID" \
    -d "client_secret=$CLIENT_SECRET" \
    -d "code=$AUTH_CODE" \
    -d "grant_type=authorization_code" \
    -d "redirect_uri=$REDIRECT_URI")

# Step 5: Extract the token type, access token, and refresh token
TOKEN_TYPE=$(echo $RESPONSE | grep -o '"token_type":"[^"]*' | grep -o '[^"]*$')
ACCESS_TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')
REFRESH_TOKEN=$(echo $RESPONSE | grep -o '"refresh_token":"[^"]*' | grep -o '[^"]*$')

# Step 6: Output the results
if [ -n "$ACCESS_TOKEN" ]; then
    echo "Token Type: $TOKEN_TYPE"
    echo "Access Token: $ACCESS_TOKEN"
    echo "Refresh Token: $REFRESH_TOKEN"
else
    echo "Failed to retrieve the tokens. Response from Twitch:"
    echo $RESPONSE
fi