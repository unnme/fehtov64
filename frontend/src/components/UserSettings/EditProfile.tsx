import { useState } from "react"
import { Settings, User, Lock, Trash2 } from "lucide-react"

import ChangePassword from "@/components/UserSettings/ChangePassword"
import DeleteAccount from "@/components/UserSettings/DeleteAccount"
import UserInformation from "@/components/UserSettings/UserInformation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useAuth from "@/hooks/useAuth"

const tabsConfig = [
  { 
    value: "my-profile", 
    title: "Профиль", 
    icon: User,
    component: UserInformation 
  },
  { 
    value: "password", 
    title: "Пароль", 
    icon: Lock,
    component: ChangePassword 
  },
  { 
    value: "danger-zone", 
    title: "Опасная зона", 
    icon: Trash2,
    component: DeleteAccount 
  },
]

const EditProfile = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user: currentUser } = useAuth()
  const finalTabs = currentUser?.is_superuser
    ? tabsConfig.slice(0, 3)
    : tabsConfig

  if (!currentUser) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Settings />
        Настройки профиля
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройки профиля</DialogTitle>
          <DialogDescription>
            Управление настройками вашего аккаунта
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="my-profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {finalTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.title}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
          {finalTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-6">
              <tab.component />
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default EditProfile

