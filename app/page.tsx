
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHomePage } from '@/config/app'

export default async function Home() {
  const session = await auth()
  
  // If user is authenticated, redirect to their department home page
  if (session?.user) {
    // Check if user has admin access - don't redirect admin users
    const userRole = session.user.role;
    const userDepartment = session.user.department || session.user.centralDepartment;
    
    console.log('Root page - User authenticated:', { userRole, userDepartment });
    
    // Define admin roles and departments
    const adminRoles = ['ADMIN', 'GENERAL_DIRECTOR', 'GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER', 'ASSISTANT_GENERAL_MANAGER_2', 'SENIOR_MANAGER'];
    const adminDepartments = ['IS', 'ADMIN', 'IT'];
    
    // Map the user role to the config key format (handles spaces vs underscores)
    const { mapRoleToConfigKey } = await import('@/config/app');
    const mappedRole = mapRoleToConfigKey(userRole);
    
    console.log('Root page - Mapped role:', mappedRole);
    
    const hasAdminRole = adminRoles.includes(mappedRole);
    const hasAdminDepartment = adminDepartments.includes(userDepartment);
    
    console.log('Root page - Admin access check:', { hasAdminRole, hasAdminDepartment });
    
    // If user has admin access, don't redirect - let them choose where to go
    if (hasAdminRole || hasAdminDepartment) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/home-jpandi.webp')"
          }}>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Welcome to UXOne
            </h1>
            <p className="text-xl text-white/90 drop-shadow-md">
              Project Management System
            </p>
            <div className="mt-6 space-y-3">
              <a href="/lvm/admin" className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Access Admin Panel
              </a>
              <a href="/lvm" className="block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Go to LVM
              </a>
            </div>
          </div>
        </div>
      );
    }
    
    // For non-admin users, redirect to their department home page
    console.log('Root page - Non-admin user, redirecting to:', getUserHomePage(userDepartment || 'UNKNOWN'));
    const userHomePage = getUserHomePage(userDepartment || 'UNKNOWN')
    redirect(userHomePage)
  }
  
  // If not authenticated, redirect to sign in
  redirect('/auth/signin')
}
