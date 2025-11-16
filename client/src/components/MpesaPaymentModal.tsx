import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Smartphone } from 'lucide-react';

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  amount: number;
  onSuccess?: () => void;
}

export default function MpesaPaymentModal({ 
  isOpen, 
  onClose, 
  studentName, 
  amount,
  onSuccess 
}: MpesaPaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');

  const handlePayment = () => {
    console.log('Initiating M-Pesa payment:', { phoneNumber, amount });
    setStep('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setStep('input');
        setPhoneNumber('');
      }, 2000);
    }, 3000);
  };

  const formatCurrency = (value: number) => {
    return `KES ${value.toLocaleString()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-mpesa-payment">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            M-Pesa Payment
          </DialogTitle>
          <DialogDescription>
            Complete payment for {studentName}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4 text-center">
              <div className="text-sm text-muted-foreground">Amount to Pay</div>
              <div className="text-3xl font-bold mt-1" data-testid="text-payment-amount">
                {formatCurrency(amount)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="254712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="input-phone-number"
              />
              <p className="text-xs text-muted-foreground">
                Enter your M-Pesa registered phone number
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="flex-1"
                data-testid="button-cancel-payment"
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePayment} 
                disabled={!phoneNumber || phoneNumber.length < 10}
                className="flex-1"
                data-testid="button-initiate-payment"
              >
                Pay {formatCurrency(amount)}
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <div className="font-medium">Processing Payment</div>
              <p className="text-sm text-muted-foreground mt-1">
                Check your phone for M-Pesa prompt
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 dark:text-green-500" />
            <div>
              <div className="font-medium text-lg">Payment Successful!</div>
              <p className="text-sm text-muted-foreground mt-1">
                Transaction complete
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
