import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHomePage } from '@/config/app'

const HomePage = async () => {
  const session = await auth()
  
  if (session?.user) {
    // Check if user has admin access - don't redirect admin users
    const userRole = session.user.role;
    const userDepartment = session.user.department || session.user.centralDepartment;
    
    // Define admin roles and departments
    const adminRoles = ['ADMIN', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'SENIOR_MANAGER'];
    const adminDepartments = ['IS', 'ADMIN', 'IT'];
    
    // Map the user role to the config key format (handles spaces vs underscores)
    const { mapRoleToConfigKey } = await import('@/config/app');
    const mappedRole = mapRoleToConfigKey(userRole);
    
    const hasAdminRole = adminRoles.includes(mappedRole);
    const hasAdminDepartment = adminDepartments.includes(userDepartment);
    
    // If user has admin access, don't redirect - let them stay on LVM page
    if (!(hasAdminRole || hasAdminDepartment)) {
      // Redirect to user's department-specific home page
      const userHomePage = getUserHomePage(userDepartment || 'UNKNOWN')
      
      // If the user's department has a specific home page, redirect there
      if (userHomePage !== '/lvm') {
        redirect(userHomePage)
      }
    }
  }
  
  // Default LVM landing page for users without specific department pages
  return (
    <div 
      className="flex flex-col items-center justify-center h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/home-jpandi.webp')"
      }}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
          Welcome to LVM
        </h1>
        <p className="text-xl text-white/90 drop-shadow-md">
          Project Management System
        </p>
        <p className="text-lg text-white/80 drop-shadow-md mt-2">
          {session?.user ? 'Welcome to LVM Dashboard' : 'Redirecting to your department dashboard...'}
        </p>
      </div>
    </div>
  );
};

export default HomePage;
