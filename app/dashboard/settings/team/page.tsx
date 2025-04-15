"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { Plus, Lock, Users, Trash, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  status: "active" | "pending";
  joinedAt: string;
};

export default function TeamMembersPage() {
  const { user } = useAuth();
  const isPro = user?.subscriptionTier === "pro";
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  
  // Mock team members data - in a real app, this would come from an API
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      email: user?.email || "owner@example.com",
      name: user?.fullName || "Account Owner",
      role: "admin",
      status: "active",
      joinedAt: new Date().toISOString()
    },
    {
      id: "2",
      email: "team.member@example.com",
      name: "Team Member",
      role: "editor",
      status: "active",
      joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "3",
      email: "pending.user@example.com",
      name: "",
      role: "viewer",
      status: "pending",
      joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  const sendInvite = () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    if (!isPro) {
      toast.error("Team members feature requires Pro plan");
      return;
    }
    
    setIsInviting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newMember: TeamMember = {
        id: `new-${Date.now()}`,
        email: inviteEmail,
        name: "",
        role: "viewer",
        status: "pending",
        joinedAt: new Date().toISOString()
      };
      
      setTeamMembers([...teamMembers, newMember]);
      setInviteEmail("");
      setIsInviting(false);
      
      toast.success("Invitation sent", {
        description: `Invitation email sent to ${inviteEmail}`
      });
    }, 1500);
  };
  
  const removeTeamMember = (id: string) => {
    if (id === "1") {
      toast.error("Cannot remove account owner");
      return;
    }
    
    // Simulate API call
    setTeamMembers(teamMembers.filter(member => member.id !== id));
    toast.success("Team member removed");
  };
  
  const resendInvite = (email: string) => {
    toast.success("Invitation resent", {
      description: `A new invitation has been sent to ${email}`
    });
  };
  
  const updateRole = (id: string, role: "admin" | "editor" | "viewer") => {
    setTeamMembers(teamMembers.map(member => 
      member.id === id ? { ...member, role } : member
    ));
    
    toast.success("Role updated");
  };

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">
            Invite and manage your team members
          </p>
        </div>
        
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-10">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Multi-User Teams</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Add team members to collaborate on campaigns and share resources. This feature is available on the Pro plan.
            </p>
            <Button asChild>
              <Link href="/dashboard/billing">
                Upgrade to Pro
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Members</h1>
        <p className="text-muted-foreground">
          Invite and manage your team members
        </p>
      </div>
      
      <Card className="p-6">
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="invites">Pending Invites</TabsTrigger>
          </TabsList>
          
          <TabsContent value="members">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h3 className="text-lg font-medium">Active Team Members</h3>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">{teamMembers.filter(m => m.status === "active").length} of 5 seats used</span>
                  <Button size="sm" className="gap-1" onClick={() => document.getElementById("invite-email")?.focus()}>
                    <Plus className="h-4 w-4" />
                    <span>Invite Member</span>
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-2 p-4 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                  <div className="col-span-5">User</div>
                  <div className="col-span-3">Role</div>
                  <div className="col-span-3">Joined</div>
                  <div className="col-span-1"></div>
                </div>
                {teamMembers
                  .filter(member => member.status === "active")
                  .map(member => (
                    <div key={member.id} className="grid grid-cols-12 gap-2 p-4 border-b last:border-0 items-center text-sm">
                      <div className="col-span-5">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-muted-foreground">{member.email}</div>
                      </div>
                      <div className="col-span-3">
                        <select 
                          className="w-full text-sm p-1 rounded border bg-background"
                          value={member.role}
                          onChange={(e) => updateRole(member.id, e.target.value as "admin" | "editor" | "viewer")}
                          disabled={member.id === "1"} // Can't change owner's role
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                      <div className="col-span-3 text-muted-foreground">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {member.id !== "1" && (
                          <button 
                            onClick={() => removeTeamMember(member.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
              
              <div className="mt-6">
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Invite New Team Member</h4>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="invite-email" className="sr-only">Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="colleague@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <Button onClick={sendInvite} disabled={isInviting}>
                      {isInviting ? "Sending..." : "Send Invite"}
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p>Team member permissions:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li><strong>Admin:</strong> Full access to all features, can manage team members</li>
                    <li><strong>Editor:</strong> Can create and edit campaigns, view analytics</li>
                    <li><strong>Viewer:</strong> Can view campaigns and analytics, but cannot edit</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="invites">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pending Invitations</h3>
              
              {teamMembers.filter(member => member.status === "pending").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No pending invitations</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 gap-2 p-4 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                    <div className="col-span-6">Email</div>
                    <div className="col-span-3">Role</div>
                    <div className="col-span-3">Actions</div>
                  </div>
                  {teamMembers
                    .filter(member => member.status === "pending")
                    .map(member => (
                      <div key={member.id} className="grid grid-cols-12 gap-2 p-4 border-b last:border-0 items-center text-sm">
                        <div className="col-span-6">
                          {member.email}
                        </div>
                        <div className="col-span-3 capitalize">
                          {member.role}
                        </div>
                        <div className="col-span-3 flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8"
                            onClick={() => resendInvite(member.email)}
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Resend
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-destructive hover:text-destructive"
                            onClick={() => removeTeamMember(member.id)}
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
      
      <Card className="p-4 border-green-200 bg-green-50">
        <div className="flex gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-800">Pro Plan Active</h3>
            <p className="text-green-700 text-sm">
              You have access to team collaboration features with up to 5 team members.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 