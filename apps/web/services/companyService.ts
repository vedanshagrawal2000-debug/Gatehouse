import { Company, CompanyIsolatedData } from '../types';

export const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'comp-apex',
    name: 'Apex Cybernetics Corp',
    code: 'APEX',
    industry: 'Industrial Hardware & Optical Transceivers',
    db_type: 'mongodb',
    db_status: 'ONLINE // AIR-GAPPED ENCLAVE',
    encryption: 'AES-256-GCM + eBPF Sandbox',
    tenant_id: 'TENANT-APEX-8820',
    last_sync: '14:22:04 UTC',
    agent_count: 4,
    inventory_count: 4,
    enquiry_count: 2,
    depleted_skus: 2,
  },
  {
    id: 'comp-cyberdyne',
    name: 'Cyberdyne Dynamics',
    code: 'CYBERDYNE',
    industry: 'Autonomous Robotics & Defense Systems',
    db_type: 'mongodb',
    db_status: 'ONLINE // ENCRYPTED ENCLAVE',
    encryption: 'NIST FIPS 140-3 Cryptographic Core',
    tenant_id: 'TENANT-CYBER-9901',
    last_sync: '14:21:50 UTC',
    agent_count: 3,
    inventory_count: 3,
    enquiry_count: 1,
    depleted_skus: 2,
  },
  {
    id: 'comp-omnicorp',
    name: 'OmniCorp Healthcare & BioTech',
    code: 'OMNICORP',
    industry: 'Pharmaceuticals & Cold-Chain Logistics',
    db_type: 'mongodb',
    db_status: 'ONLINE // HIPAA COMPLIANT',
    encryption: 'HIPAA + HITECH FIPS-256',
    tenant_id: 'TENANT-OMNI-7712',
    last_sync: '14:20:12 UTC',
    agent_count: 3,
    inventory_count: 3,
    enquiry_count: 1,
    depleted_skus: 2,
  },
];

export async function fetchCompanies(): Promise<Company[]> {
  try {
    const res = await fetch('/api/companies', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.companies) && data.companies.length > 0) {
        return data.companies;
      }
    }
  } catch (err) {
    console.warn('Backend /api/companies fallback:', err);
  }
  return DEFAULT_COMPANIES;
}

export async function fetchCompanyData(companyId: string): Promise<CompanyIsolatedData | null> {
  try {
    const res = await fetch(`/api/companies/${companyId}/data`, { cache: 'no-store' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`/api/companies/${companyId}/data fallback:`, err);
  }
  return null;
}

export async function connectCompanyDb(companyId: string, mongoUri: string, dbName: string) {
  try {
    const res = await fetch(`/api/companies/${companyId}/connect-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mongo_uri: mongoUri, db_name: dbName }),
    });
    if (res.ok) {
      return await res.json();
    }
    return { success: false, error: `Failed with status ${res.status}` };
  } catch (err) {
    console.warn('connectCompanyDb fallback:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function registerCompany(payload: {
  name: string;
  industry: string;
  db_type: string;
  db_uri?: string;
  db_name?: string;
}) {
  try {
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
    return { success: false, error: `Failed with status ${res.status}` };
  } catch (err) {
    console.warn('registerCompany fallback:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function chatWithGemini(message: string, companyId: string) {
  try {
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, company_id: companyId }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Gemini chat API fallback:', err);
  }
  return null;
}
