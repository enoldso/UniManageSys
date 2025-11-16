import SellerDashboard from '../SellerDashboard';

export default function SellerDashboardExample() {
  return (
    <SellerDashboard 
      onLogout={() => console.log('Logout clicked')}
    />
  );
}
