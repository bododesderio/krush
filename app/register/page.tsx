import { getUser } from "@/lib/auth"
import { RegisterForm } from "@/components/register-form"
import { redirect } from "next/navigation"
import { KrushLogo } from "@/components/krush-logo"

export default async function RegisterPage() {
  const user = await getUser()

  if (user) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex justify-center mb-8">
            <KrushLogo size="lg" />
          </div>
          <RegisterForm />
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-krush to-red-500">
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-white px-8">
              <h2 className="text-4xl font-bold mb-4">Join Krush Today</h2>
              <p className="text-xl">
                Create your account to start messaging with friends, family, and colleagues. Experience modern
                communication with Krush.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
