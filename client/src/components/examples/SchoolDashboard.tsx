import SchoolDashboard from '../SchoolDashboard';

export default function SchoolDashboardExample() {
  return (
    <SchoolDashboard 
      schoolName="Greenfield Academy"
      onLogout={() => console.log('Logout clicked')}
    />
  );
}
