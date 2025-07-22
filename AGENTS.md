# Petty Cash Backend API

This document provides instructions for interacting with the Petty Cash backend API, which is built on Supabase.

## Authentication

Authentication is handled by Supabase Auth. To authenticate, send a POST request to the `/auth/v1/token?grant_type=password` endpoint with the user's email and password in the request body.

## User Management

User management is handled by the `users` table in the Supabase database.

### Create a new user

To create a new user, send a POST request to the `/auth/v1/signup` endpoint with the user's email, password, and role in the request body. Only admins can create new users.

### Update a user

To update a user, send a PUT request to the `/rest/v1/users` endpoint with the user's ID and the new data in the request body.

## Logging

All actions that modify data are logged in the `logs` table in the Supabase database. To view the logs, send a GET request to the `/rest/v1/logs` endpoint. Only admins can view the logs.
