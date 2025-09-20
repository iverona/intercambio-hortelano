"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function TestExchangeFlowPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-center text-gray-600">
            Please log in to test the exchange flow
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Test Exchange Flow</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Test Scenario</h2>
          <div className="space-y-4">
            <div className={`flex items-start gap-3 ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${step > 1 ? 'bg-green-500' : 'bg-blue-500'}`}>
                {step > 1 ? <CheckCircle className="w-3 h-3 text-white" /> : <span className="text-white text-xs">1</span>}
              </div>
              <div>
                <p className="font-medium">User A creates a product</p>
                <p className="text-sm text-gray-600">Lists &quot;Organic Tomatoes&quot; for exchange</p>
              </div>
            </div>
            
            <div className={`flex items-start gap-3 ${step >= 2 ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${step > 2 ? 'bg-green-500' : step === 2 ? 'bg-blue-500' : 'bg-gray-300'}`}>
                {step > 2 ? <CheckCircle className="w-3 h-3 text-white" /> : <span className="text-white text-xs">2</span>}
              </div>
              <div>
                <p className="font-medium">User B makes an offer</p>
                <p className="text-sm text-gray-600">Offers &quot;Fresh Lettuce&quot; in exchange</p>
                <p className="text-sm text-blue-600 font-medium mt-1">→ User A receives: &quot;New exchange offer: Fresh Lettuce for your Organic Tomatoes&quot;</p>
              </div>
            </div>
            
            <div className={`flex items-start gap-3 ${step >= 3 ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${step > 3 ? 'bg-green-500' : step === 3 ? 'bg-blue-500' : 'bg-gray-300'}`}>
                {step > 3 ? <CheckCircle className="w-3 h-3 text-white" /> : <span className="text-white text-xs">3</span>}
              </div>
              <div>
                <p className="font-medium">User A accepts the offer</p>
                <p className="text-sm text-gray-600">Clicks &quot;Accept Offer&quot; in the exchange chat</p>
                <p className="text-sm text-green-600 font-medium mt-1">→ User B receives: &quot;Your offer for Organic Tomatoes was accepted!&quot;</p>
              </div>
            </div>
            
            <div className={`flex items-start gap-3 ${step >= 4 ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center ${step > 4 ? 'bg-green-500' : step === 4 ? 'bg-blue-500' : 'bg-gray-300'}`}>
                {step > 4 ? <CheckCircle className="w-3 h-3 text-white" /> : <span className="text-white text-xs">4</span>}
              </div>
              <div>
                <p className="font-medium">Exchange is completed</p>
                <p className="text-sm text-gray-600">Either user marks the exchange as complete</p>
                <p className="text-sm text-purple-600 font-medium mt-1">→ Other user receives: &quot;Exchange completed for Organic Tomatoes&quot;</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Expected Notifications</h2>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="font-medium text-sm">New Offer (to product owner)</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Exchange: &quot;New exchange offer: Fresh Lettuce for your Organic Tomatoes&quot;<br/>
                Purchase: &quot;New purchase offer: €25.50 for your Organic Tomatoes&quot;<br/>
                Chat: &quot;Someone wants to chat about your Organic Tomatoes&quot;
              </p>
            </div>
            
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="font-medium text-sm">Offer Accepted (to requester)</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                &quot;Your offer for Organic Tomatoes was accepted!&quot;
              </p>
            </div>
            
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="font-medium text-sm">Offer Rejected (to requester)</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                &quot;Your offer for Organic Tomatoes was declined&quot;
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <p className="font-medium text-sm">Exchange Completed (to other party)</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                &quot;Exchange completed for Organic Tomatoes&quot;
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      <Card className="mt-6 p-6 bg-gray-50 dark:bg-gray-900">
        <h3 className="font-semibold mb-3">Testing Instructions</h3>
        <ol className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="font-medium">1.</span>
            <div>
              <p>Open two browser windows with different user accounts</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium">2.</span>
            <div>
              <p>User A: Create a product listing</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium">3.</span>
            <div>
              <p>User B: Make an offer on that product</p>
              <p className="text-blue-600 dark:text-blue-400">→ User A should see specific notification with offer details</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium">4.</span>
            <div>
              <p>User A: Go to the exchange chat and accept/reject the offer</p>
              <p className="text-green-600 dark:text-green-400">→ User B should see specific notification about the decision</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-medium">5.</span>
            <div>
              <p>Either user: Mark the exchange as completed</p>
              <p className="text-purple-600 dark:text-purple-400">→ Other user should see completion notification</p>
            </div>
          </li>
        </ol>
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium mb-2">Quick Test Links:</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/publish', '_blank')}
            >
              Create Product
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/', '_blank')}
            >
              Browse Products
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/test-notifications-complete', '_blank')}
            >
              Test Notifications
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="mt-6 flex justify-center">
        <Button
          onClick={() => setStep(step < 4 ? step + 1 : 1)}
          className="gap-2"
        >
          {step < 4 ? (
            <>
              Next Step
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            'Reset'
          )}
        </Button>
      </div>
    </div>
  );
}
