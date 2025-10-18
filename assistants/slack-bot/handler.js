// slack-bot/handler.js
// Spec-MAS Specification Assistant Slack Bot

const { App } = require('@slack/bolt');
const { Anthropic } = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Load system prompt and context
let SYSTEM_PROMPT = '';
let MATURITY_MODEL = '';

async function loadContext() {
  try {
    SYSTEM_PROMPT = await fs.readFile(
      path.join(__dirname, '../claude-project/system-prompt.md'), 
      'utf8'
    );
    MATURITY_MODEL = await fs.readFile(
      path.join(__dirname, '../claude-project/maturity-model.md'), 
      'utf8'
    );
  } catch (error) {
    console.error('Error loading context files:', error);
  }
}

// Store active specifications in memory (use database in production)
const activeSpecs = new Map();

// Slash command handler
app.command('/spec', async ({ command, ack, say, client }) => {
  await ack();
  
  const userId = command.user_id;
  const text = command.text.trim();
  const [action, ...args] = text.split(' ');
  
  try {
    switch(action) {
      case 'new':
        await handleNewSpec(say, userId, args.join(' '));
        break;
      
      case 'assess':
        await handleAssess(say, userId);
        break;
      
      case 'enhance':
        await handleEnhance(say, userId);
        break;
      
      case 'validate':
        await handleValidate(say, userId);
        break;
      
      case 'export':
        await handleExport(say, userId, client);
        break;
      
      case 'help':
      default:
        await showHelp(say);
        break;
    }
  } catch (error) {
    console.error('Error handling command:', error);
    await say(`❌ An error occurred: ${error.message}`);
  }
});

// Handle new specification
async function handleNewSpec(say, userId, description) {
  if (!description) {
    await say({
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '📝 *Start New Specification*\n\nPlease provide a description of your feature:\n`/spec new [your feature description]`'
        }
      }]
    });
    return;
  }
  
  // Call Claude to assess complexity and start spec
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `/new ${description}`
    }],
    system: SYSTEM_PROMPT + '\n\n' + MATURITY_MODEL
  });
  
  const responseText = response.content[0].text;
  
  // Parse response to extract complexity and level
  const complexityMatch = responseText.match(/Complexity:\s*(\w+)/);
  const levelMatch = responseText.match(/Required Level:\s*(\d)/);
  
  // Store spec state
  activeSpecs.set(userId, {
    description,
    complexity: complexityMatch ? complexityMatch[1] : 'MODERATE',
    currentLevel: 0,
    requiredLevel: levelMatch ? parseInt(levelMatch[1]) : 3,
    content: {},
    conversation: [responseText]
  });
  
  // Send formatted response
  await say({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: responseText
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Continue ➡️' },
            action_id: 'continue_spec',
            style: 'primary'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Assess Progress 📊' },
            action_id: 'assess_spec'
          }
        ]
      }
    ]
  });
}

// Handle assess command
async function handleAssess(say, userId) {
  const spec = activeSpecs.get(userId);
  
  if (!spec) {
    await say('No active specification found. Start one with `/spec new [description]`');
    return;
  }
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: spec.conversation.join('\n\n')
      },
      {
        role: 'user',
        content: '/assess'
      }
    ],
    system: SYSTEM_PROMPT
  });
  
  const assessment = response.content[0].text;
  
  // Create progress visualization
  const progressBar = createProgressBar(spec.currentLevel, spec.requiredLevel);
  
  await say({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Specification Assessment*\n\n${progressBar}\n\n${assessment}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Complexity: *${spec.complexity}* | Current Level: *${spec.currentLevel}/5* | Required: *Level ${spec.requiredLevel}*`
          }
        ]
      }
    ]
  });
}

// Handle enhance command
async function handleEnhance(say, userId) {
  const spec = activeSpecs.get(userId);
  
  if (!spec) {
    await say('No active specification found. Start one with `/spec new [description]`');
    return;
  }
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: spec.conversation.join('\n\n')
      },
      {
        role: 'user',
        content: '/enhance'
      }
    ],
    system: SYSTEM_PROMPT
  });
  
  const enhancement = response.content[0].text;
  spec.conversation.push(enhancement);
  
  await say({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: enhancement
        }
      }
    ]
  });
}

// Handle validate command
async function handleValidate(say, userId) {
  const spec = activeSpecs.get(userId);
  
  if (!spec) {
    await say('No active specification found.');
    return;
  }
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: spec.conversation.join('\n\n')
      },
      {
        role: 'user',
        content: '/validate'
      }
    ],
    system: SYSTEM_PROMPT
  });
  
  const validation = response.content[0].text;
  const isReady = spec.currentLevel >= spec.requiredLevel;
  
  await say({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Validation Results*\n\n${validation}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: isReady ? 
            '✅ *This specification is AGENT-READY!*' : 
            `⚠️ *Not agent-ready yet.* Need Level ${spec.requiredLevel}, currently at Level ${spec.currentLevel}`
        }
      }
    ]
  });
}

// Handle export command
async function handleExport(say, userId, client) {
  const spec = activeSpecs.get(userId);
  
  if (!spec) {
    await say('No active specification found.');
    return;
  }
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: spec.conversation.join('\n\n')
      },
      {
        role: 'user',
        content: '/export'
      }
    ],
    system: SYSTEM_PROMPT
  });
  
  const markdown = response.content[0].text;
  
  // Upload as file
  try {
    const result = await client.files.upload({
      channels: command.channel_id,
      content: markdown,
      filename: `specification-${Date.now()}.md`,
      filetype: 'markdown',
      title: 'Exported Specification'
    });
    
    await say('📄 Specification exported successfully!');
  } catch (error) {
    console.error('Error uploading file:', error);
    await say('Error exporting specification. Please try again.');
  }
}

// Show help message
async function showHelp(say) {
  await say({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Spec-MAS Assistant Commands*'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '• `/spec new [description]` - Start new specification\n' +
                '• `/spec assess` - Evaluate current specification\n' +
                '• `/spec enhance` - Improve to next maturity level\n' +
                '• `/spec validate` - Check if agent-ready\n' +
                '• `/spec export` - Export as markdown file\n' +
                '• `/spec help` - Show this help message'
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '💡 *Tip:* Start with a simple description and let the assistant guide you to the required maturity level.'
          }
        ]
      }
    ]
  });
}

// Handle button interactions
app.action('continue_spec', async ({ body, ack, say }) => {
  await ack();
  const userId = body.user.id;
  await handleEnhance(say, userId);
});

app.action('assess_spec', async ({ body, ack, say }) => {
  await ack();
  const userId = body.user.id;
  await handleAssess(say, userId);
});

// Handle direct messages
app.message(async ({ message, say }) => {
  if (message.channel_type === 'im') {
    const userId = message.user;
    const spec = activeSpecs.get(userId);
    
    if (!spec) {
      await say('Hi! I can help you create agent-ready specifications. Start with `/spec new [description]`');
      return;
    }
    
    // Continue conversation with Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: spec.conversation.join('\n\n')
        },
        {
          role: 'user',
          content: message.text
        }
      ],
      system: SYSTEM_PROMPT
    });
    
    const reply = response.content[0].text;
    spec.conversation.push(message.text);
    spec.conversation.push(reply);
    
    await say(reply);
  }
});

// Utility function to create progress bar
function createProgressBar(current, required) {
  const total = 5;
  let bar = '';
  
  for (let i = 1; i <= total; i++) {
    if (i <= current) {
      bar += '⭐';
    } else if (i === required) {
      bar += '🎯';
    } else {
      bar += '☆';
    }
  }
  
  return `Progress: ${bar} (Level ${current}/${required})`;
}

// Start the app
(async () => {
  await loadContext();
  await app.start();
  console.log('⚡️ Spec-MAS Slack bot is running!');
})();
