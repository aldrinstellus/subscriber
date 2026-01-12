import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Subscriber</h1>
          <p className="text-gray-500 mt-2">Track your subscriptions</p>
        </div>
        <SignUp 
          path="/sign-up" 
          routing="path" 
          signInUrl="/sign-in"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg',
            }
          }}
        />
      </div>
    </div>
  );
}
