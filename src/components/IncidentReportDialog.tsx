import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupermarketData } from '@/types/supermarket';
import { SupermarketIncident, IncidentReportForm } from '@/types/incident';

interface IncidentReportDialogProps {
  supermarket: SupermarketData | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: IncidentReportForm) => void;
}

const IncidentReportDialog: React.FC<IncidentReportDialogProps> = ({
  supermarket,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [reportType, setReportType] = useState<SupermarketIncident['incident_type']>('machine_broken');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [priority, setPriority] = useState<SupermarketIncident['priority']>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supermarket) return;

    onSubmit({
      supermarket_id: supermarket.id,
      incident_type: reportType,
      description,
      reporter_name: reporterName,
      reporter_email: reporterEmail || undefined,
      priority,
    });

    // Reset form
    setDescription('');
    setReporterName('');
    setReporterEmail('');
    setReportType('machine_broken');
    setPriority('medium');
    onClose();
  };

  if (!supermarket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Incident Melden</DialogTitle>
          <DialogDescription>
            Meld een probleem met de flesseninzameling bij {supermarket.chain} in {supermarket.city}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label>Type incident</Label>
            <RadioGroup value={reportType} onValueChange={(value) => setReportType(value as SupermarketIncident['incident_type'])}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="machine_broken" id="machine_broken" />
                <Label htmlFor="machine_broken">Automaat defect</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="machine_full" id="machine_full" />
                <Label htmlFor="machine_full">Automaat vol</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="machine_offline" id="machine_offline" />
                <Label htmlFor="machine_offline">Automaat offline</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no_bottles_accepted" id="no_bottles_accepted" />
                <Label htmlFor="no_bottles_accepted">Flessen worden niet geaccepteerd</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial_functionality" id="partial_functionality" />
                <Label htmlFor="partial_functionality">Gedeeltelijke functionaliteit</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioriteit</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as SupermarketIncident['priority'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Laag</SelectItem>
                <SelectItem value="medium">Gemiddeld</SelectItem>
                <SelectItem value="high">Hoog</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              placeholder="Beschrijf het probleem in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reporterName">Uw naam (optioneel)</Label>
            <Input
              id="reporterName"
              placeholder="Naam"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reporterEmail">Uw email (optioneel)</Label>
            <Input
              id="reporterEmail"
              type="email"
              placeholder="email@example.com"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button type="submit">
              Incident Melden
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentReportDialog;