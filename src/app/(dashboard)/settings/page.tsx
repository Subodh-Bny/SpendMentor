import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UpdateAccount from "@/components/settings/update-account";
import ChangePassword from "@/components/settings/change-password";

const Settings = () => {
  return (
    <Tabs defaultValue="account" className="md:w-[650px] mx-auto">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="income">Income</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <UpdateAccount />
      </TabsContent>
      <TabsContent value="password">
        <ChangePassword />
      </TabsContent>
    </Tabs>
  );
};

export default Settings;
