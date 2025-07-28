
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHomePage } from '@/config/app'

export default async function Home() {
  const session = await auth()
  
  // If user is authenticated, redirect to their department home page
  if (session?.user) {
    const userHomePage = getUserHomePage(session.user.department || 'UNKNOWN')
    redirect(userHomePage)
  }
  
  // If not authenticated, redirect to sign in
  redirect('/auth/signin')
}
