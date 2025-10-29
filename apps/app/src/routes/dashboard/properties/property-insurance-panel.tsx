"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Textarea } from "@kaa/ui/components/textarea";
import { AlertCircle, FileText, Shield } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  type InsuranceClaimType,
  useCreateInsuranceClaim,
  useExpiredPolicies,
  useInsuranceClaims,
  useInsurancePolicies,
} from "@/modules/properties/insurance";

type PropertyInsurancePanelProps = {
  propertyId: string;
  landlordId: string;
};

export const PropertyInsurancePanel: React.FC<PropertyInsurancePanelProps> = ({
  propertyId,
  landlordId,
}) => {
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimFormData, setClaimFormData] = useState({
    claimType: "",
    description: "",
    claimedAmount: "",
    incidentDate: "",
  });

  const {
    data: policiesData,
    isLoading: loadingPolicies,
    error: policiesError,
  } = useInsurancePolicies({ property: propertyId });

  const {
    data: claimsData,
    isLoading: loadingClaims,
    error: claimsError,
  } = useInsuranceClaims({ property: propertyId });

  const { data: expiredData, isLoading: loadingExpired } = useExpiredPolicies();

  const { mutate: createClaim, isPending: creatingClaim } =
    useCreateInsuranceClaim();

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    createClaim(
      {
        ...claimFormData,
        claimType: claimFormData.claimType as InsuranceClaimType,
        claimedAmount: Number.parseFloat(claimFormData.claimedAmount),
        property: propertyId,
        landlord: landlordId,
        policy: "",
        incident: {
          type: claimFormData.claimType as InsuranceClaimType,
          location: "",
          witnesses: [],
        },
      },
      {
        onSuccess: () => {
          setShowClaimForm(false);
          setClaimFormData({
            claimType: "",
            description: "",
            claimedAmount: "",
            incidentDate: "",
          });
        },
      }
    );
  };

  const policies = policiesData?.data?.policies || [];
  const claims = claimsData?.data?.claims || [];
  const expiredPolicies = expiredData?.data?.policies || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">
            Insurance Management
          </h2>
          <p className="text-muted-foreground">
            Manage policies, file claims, and track coverage
          </p>
        </div>
        <Button onClick={() => setShowClaimForm(true)}>
          <FileText className="mr-2 h-4 w-4" />
          File New Claim
        </Button>
      </div>

      <Tabs className="w-full" defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies">
            Active Policies
            {policies.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {policies.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="claims">
            Claims
            {claims.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {claims.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired
            {expiredPolicies.length > 0 && (
              <Badge className="ml-2" variant="destructive">
                {expiredPolicies.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value="policies">
          {loadingPolicies ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton className="h-32 w-full" key={i} />
              ))}
            </div>
          ) : policiesError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Error loading policies</AlertDescription>
            </Alert>
          ) : policies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-lg">
                  No active policies
                </h3>
                <p className="text-center text-muted-foreground text-sm">
                  Add insurance policies to protect your property
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {policies.map((policy) => (
                <Card key={policy._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {policy.provider}
                        </CardTitle>
                        <CardDescription className="capitalize">
                          {policy.insuranceType}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          policy.status === "active"
                            ? "default"
                            : policy.status === "expired"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {policy.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Coverage</p>
                        <p className="font-semibold">
                          ${policy.coverage?.buildingValue?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Premium</p>
                        <p className="font-semibold">
                          ${policy.premium?.annualPremium?.toLocaleString()}
                          /year
                        </p>
                      </div>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Expires:{" "}
                      {new Date(policy.terms?.endDate).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent className="mt-6" value="claims">
          {loadingClaims ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton className="h-32 w-full" key={i} />
              ))}
            </div>
          ) : claimsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Error loading claims</AlertDescription>
            </Alert>
          ) : claims.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-lg">No claims filed</h3>
                <p className="text-center text-muted-foreground text-sm">
                  File a claim when you need to report an incident
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <Card key={claim._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Claim #{claim.claimNumber}
                        </CardTitle>
                        <CardDescription className="capitalize">
                          {claim.claimType}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          claim.status === "approved"
                            ? "default"
                            : claim.status === "rejected"
                              ? "destructive"
                              : claim.status === "under_review"
                                ? "secondary"
                                : "outline"
                        }
                      >
                        {claim.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm">{claim.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Claimed Amount:
                      </span>
                      <span className="font-semibold">
                        ${claim.claimedAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Filed: {new Date(claim.incidentDate).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent className="mt-6" value="expired">
          {loadingExpired ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton className="h-32 w-full" key={i} />
              ))}
            </div>
          ) : expiredPolicies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-lg">
                  No expired policies
                </h3>
                <p className="text-center text-muted-foreground text-sm">
                  All your policies are up to date
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {expiredPolicies.map((policy) => (
                <Card className="border-destructive" key={policy._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {policy.provider}
                        </CardTitle>
                        <CardDescription className="capitalize">
                          {policy.insuranceType}
                        </CardDescription>
                      </div>
                      <Button size="sm" variant="destructive">
                        Renew Policy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-destructive text-sm">
                      Expired:{" "}
                      {new Date(policy.terms?.endDate).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Claim Form Dialog */}
      <Dialog onOpenChange={setShowClaimForm} open={showClaimForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>File New Claim</DialogTitle>
            <DialogDescription>
              Submit a new insurance claim for this property
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClaim}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="claimType">Claim Type</Label>
                <Select
                  onValueChange={(value) =>
                    setClaimFormData({ ...claimFormData, claimType: value })
                  }
                  value={claimFormData.claimType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fire">Fire</SelectItem>
                    <SelectItem value="flood">Flood</SelectItem>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="vandalism">Vandalism</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  onChange={(e) =>
                    setClaimFormData({
                      ...claimFormData,
                      description: e.target.value,
                    })
                  }
                  required
                  rows={3}
                  value={claimFormData.description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="claimedAmount">Claimed Amount</Label>
                <Input
                  id="claimedAmount"
                  min="0"
                  onChange={(e) =>
                    setClaimFormData({
                      ...claimFormData,
                      claimedAmount: e.target.value,
                    })
                  }
                  required
                  step="0.01"
                  type="number"
                  value={claimFormData.claimedAmount}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="incidentDate">Incident Date</Label>
                <Input
                  id="incidentDate"
                  onChange={(e) =>
                    setClaimFormData({
                      ...claimFormData,
                      incidentDate: e.target.value,
                    })
                  }
                  required
                  type="date"
                  value={claimFormData.incidentDate}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => setShowClaimForm(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={creatingClaim} type="submit">
                {creatingClaim ? "Filing..." : "File Claim"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
