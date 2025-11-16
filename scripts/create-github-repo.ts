import { Octokit } from '@octokit/rest'

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function createRepository() {
  try {
    const octokit = await getGitHubClient();
    
    const repoName = 'scribbleguess';
    const description = 'ScribbleGuess - A multiplayer drawing and guessing game with 5 game modes (Classic, Double Draw, Blitz, Randomized, Mega)';
    
    console.log('Creating GitHub repository:', repoName);
    
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: description,
      private: false,
      auto_init: false,
    });
    
    console.log('\n✅ Repository created successfully!');
    console.log('Repository URL:', data.html_url);
    console.log('Clone URL (HTTPS):', data.clone_url);
    console.log('Clone URL (SSH):', data.ssh_url);
    console.log('\nNext steps:');
    console.log('1. The repository has been created on GitHub');
    console.log('2. Use the Replit UI to connect this repo to GitHub');
    console.log('3. Or run these commands in the shell:');
    console.log(`   git remote add origin ${data.ssh_url}`);
    console.log('   git branch -M main');
    console.log('   git add .');
    console.log('   git commit -m "Initial commit: ScribbleGuess multiplayer game"');
    console.log('   git push -u origin main');
    
  } catch (error: any) {
    if (error.status === 422) {
      console.error('❌ Repository already exists with this name.');
      console.log('Please either:');
      console.log('1. Delete the existing repository on GitHub');
      console.log('2. Or choose a different name by modifying this script');
    } else {
      console.error('❌ Error creating repository:', error.message);
    }
    process.exit(1);
  }
}

createRepository();
