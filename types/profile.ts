/**
 * Types for user profile and preferences
 */

export interface UserProfile {
  name: string;
  email: string;
  theme: 'light' | 'dark' | 'system';
  personalContext: string; // Freeform text for AI context
}

export interface ProfileFormData {
  name: string;
  email: string;
  theme: 'light' | 'dark' | 'system';
  personalContext: string;
}
