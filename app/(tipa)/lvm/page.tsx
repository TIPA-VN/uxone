import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHomePage } from '@/config/app'

const HomePage = async () => {
  const session = await auth()
  
  if (session?.user) {
    // Redirect to user's department-specific home page
    const userHomePage = getUserHomePage(session.user.department || 'UNKNOWN')
    
    // If the user's department has a specific home page, redirect there
    if (userHomePage !== '/lvm') {
      redirect(userHomePage)
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
          Redirecting to your department dashboard...
        </p>
      </div>
    </div>
  );
};

export default HomePage;
