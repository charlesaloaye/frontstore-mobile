import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Button, Screen, T } from '@/components/ui';
import { BottomBar, Heading, Labelled, Progress, RingInput, StepHeader } from '@/features/setup/parts';
import { sendEmailOtp } from '@/api/auth';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const next = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await sendEmailOtp(email.trim(), name.trim());
      router.push({ pathname: '/verify', params: { flow: 'signup', channel: 'email', to: email.trim() } });
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader fallback="/welcome" label="Step 1 of 5" />
        <Progress pct={20} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pt-7 pb-6">
          <Heading title="Create your account" sub="No password needed. We'll email you a 6-digit code." />
          {errorMsg ? (
            <View className="rounded-xl bg-red-100 p-3.5 border border-red-200">
              <T className="text-sm font-sans-medium text-red-800">{errorMsg}</T>
            </View>
          ) : null}
          <Labelled label="Your name">
            <RingInput value={name} onChangeText={setName} placeholder="e.g. Charles Aloaye" autoComplete="name" textContentType="name" accessibilityLabel="Your name" />
          </Labelled>
          <Labelled label="Email address">
            <RingInput
              autoFocus
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              accessibilityLabel="Email address"
              returnKeyType="go"
              onSubmitEditing={() => valid && next()}
              left={<Mail size={18} color="#0B6E4F" strokeWidth={2} />}
            />
          </Labelled>
        </ScrollView>
        <BottomBar>
          <Button
            title={loading ? 'Sending code...' : 'Email me a code'}
            disabled={!valid || loading}
            onPress={next}
            left={loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
          />
          <T className="text-center text-[13px] text-muted">By continuing you agree to the Terms and Privacy Policy.</T>
          <Link href="/login" asChild>
            <Pressable accessibilityRole="link" className="min-h-[44px] items-center justify-center">
              <T className="text-center text-[15px] text-muted-2">
                Already have a store? <T className="font-sans-bold text-[15px] text-green">Log in</T>
              </T>
            </Pressable>
          </Link>
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
