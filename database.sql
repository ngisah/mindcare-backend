-- Users table with cultural considerations
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    cultural_background JSONB,
    language_preference VARCHAR(5) DEFAULT 'en',
    country_code VARCHAR(2),
    timezone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE,
    account_status VARCHAR(20) DEFAULT 'active',
    privacy_settings JSONB DEFAULT '{}',
    emergency_contacts JSONB DEFAULT '[]'
);

-- User profiles with mental health context
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    age_range VARCHAR(20),
    gender_identity VARCHAR(50),
    cultural_practices JSONB DEFAULT '{}',
    support_preferences JSONB DEFAULT '{}',
    crisis_plan JSONB DEFAULT '{}',
    professional_referrals JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations with encryption
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active',
    cultural_context JSONB DEFAULT '{}',
    crisis_level INTEGER DEFAULT 0
);

-- Messages with end-to-end encryption
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_type VARCHAR(10) NOT NULL, -- 'user' or 'ai'
    encrypted_content TEXT NOT NULL,
    encryption_key_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sentiment_score DECIMAL(3,2),
    crisis_indicators JSONB DEFAULT '[]'
);

-- Assessment templates with cultural adaptations
CREATE TABLE assessment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(10) NOT NULL,
    cultural_adaptations JSONB DEFAULT '{}',
    questions JSONB NOT NULL,
    scoring_rules JSONB NOT NULL,
    interpretation_guidelines JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User assessment responses
CREATE TABLE assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    template_id UUID NOT NULL REFERENCES assessment_templates(id),
    responses JSONB NOT NULL,
    scores JSONB NOT NULL,
    interpretation JSONB NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cultural_context JSONB DEFAULT '{}'
);

-- Resources table for resourceService
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(5) NOT NULL,
    cultural_tags JSONB DEFAULT '[]',
    mental_health_topics JSONB DEFAULT '[]',
    difficulty_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts table
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community comments table
CREATE TABLE community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    payment_method_id VARCHAR(255),
    subscription_plan_id UUID, -- Can be null if it's a one-time payment
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL, -- e.g., 'completed', 'pending', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    plan_id VARCHAR(255) NOT NULL, -- e.g., 'premium_monthly', 'enterprise_annual'
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE, -- Null for lifetime or until cancelled
    status VARCHAR(50) NOT NULL, -- e.g., 'active', 'cancelled', 'expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);