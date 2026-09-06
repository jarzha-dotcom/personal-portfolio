import fs from 'fs';

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim();
  }
});

async function testPersonas() {
  const { default: handler } = await import('../api/chat');

  const personas = ['rajendra', 'zannah', 'kania'] as const;

  for (const p of personas) {
    console.log(`\n================ Testing persona: ${p} ================`);
    const req = {
      method: 'POST',
      headers: { 'x-forwarded-for': '127.0.0.1' },
      body: {
        message: 'Halo, kamu siapa ya dan apa tugasmu?',
        persona: p
      }
    } as any;

    let resData: any = null;
    const res = {
      setHeader: () => {},
      status: () => res,
      json: (data: any) => {
        resData = data;
        return res;
      },
      end: () => {}
    } as any;

    await handler(req, res);
    console.log(`[${p}] Model:`, resData?.model);
    console.log(`[${p}] Reply:\n`, resData?.reply);
  }
}

testPersonas();
