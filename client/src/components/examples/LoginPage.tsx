import LoginPage from '../LoginPage';

export default function LoginPageExample() {
  return (
    <LoginPage 
      onLogin={(type, credentials) => {
        console.log(`${type} login:`, credentials);
      }}
    />
  );
}
