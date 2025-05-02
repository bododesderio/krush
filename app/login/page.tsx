import { getUser } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { PhoneLoginForm } from "@/components/phone-login-form"
import { redirect } from "next/navigation"
import { KrushLogo } from "@/components/krush-logo"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function LoginPage() {
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

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <LoginForm />
            </TabsContent>
            <TabsContent value="phone">
              <PhoneLoginForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-krush to-red-500">
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-white px-8">
              <h2 className="text-4xl font-bold mb-4">Welcome to Krush</h2>
              <p className="text-xl">
                The modern messaging platform for teams and friends. Stay connected with real-time messaging, group
                chats, and more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
