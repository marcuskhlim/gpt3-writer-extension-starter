const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      if (result['openai-key']) {
        const decodedKey = atob(result['openai-key']);
        resolve(decodedKey);
      }
    });
  });
};

const getActiveTabId = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0].id;
      resolve(activeTab);
    });
  });
}

const sendMessageToTab = (content,tab) => {
  chrome.tabs.sendMessage(
    tab,
    { message: 'inject', content },
    (response) => {
      if (response.status === 'failed') {
        console.log('injection failed.');
      }
    }
  );
}

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (response.status === 'failed') {
          console.log('injection failed.');
        }
      }
    );
  });
}; 

const generateChatCompletion = async (system, user_assistant) => {    
  // Get your API key from storage
  const key = await getKey();
  const url = 'https://api.openai.com/v1/chat/completions';

  system_msg = [{"role": "system", "content": system}]
  user_assistant_msgs = [
    {"role": "assistant", "content": user_assistant}]
  const msgs = system_msg.concat(user_assistant_msgs)
  
  // Call chat completions endpoint
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({model: "gpt-3.5-turbo",
    messages: msgs}),
  });
  
  // Select the top choice and send back
  const completion = await completionResponse.json();
  console.log(completion.choices[0].message.content);
  return completion.choices[0].message.content;
}



const generate = async (prompt) => {
// Get your API key from storage
const key = await getKey();
const url = 'https://api.openai.com/v1/completions';

// Call completions endpoint
const completionResponse = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({
    model: 'text-davinci-003',
    prompt: prompt,
    max_tokens: 1250,
    temperature: 0.7,
  }),
});

// Select the top choice and send back
const completion = await completionResponse.json();
return completion.choices.pop();
}

const generateChatCompletionAction = async (info) => {
try {
  // Send mesage with generating text (this will be like a loading indicator)

  const tabId = await getActiveTabId();

  console.log("the tab to target is "+tabId);

  sendMessage('generating...');

  const { selectionText } = info;
  const basePromptPrefix = `
  A VSLFramework is a framework structure for a video script that incorporates the following sections - Pattern Interrupt Opener, Callout, Big Promise, Science, New Discovery, Common Enemy, Additional Big Promises, Social Proof, Different than anything else, Call to action #1, Common enemy, Final Call to Action. Below you can see each of the sections, and example(s) of each. Analyze the text and create a VSLFramework.

  Pattern Interrupt Opener (big promise, curiosity):
  1. 1 simple tweak turns you into a testosterone machine?
  2. 1 simple tweak turns your internal testosterone factory up "10" naturally
  3. Take the parking brake off your testosterone with this 1 simple tweak
  4. Seeds from the "sword tree" better than TRT?
  5. Seeds from the "sword tree" better than testosterone replacement therapy
  
  Callout (who is the audience):
  If you are a man struggling with low testosterone, decreated motivation, low energy, drive and performance in and out of the bedroom, then you need to hear this.
  
  Big Promise (curiosity, big promise):
  Thousands of men are skyrocketing their natural testosterone while they sleep with one simple tweak to their daily routine.
  
  Science (new mechanism of the problem):
  Harvard scientists confirm for the first time that testosterone problems do not begin as you age but from the moment you are born.
  
  New Discovery (New mechanism of the solution, curiosity, promises):
  Luckily, the mountains of East Nepal hold a testosterone boosting secret.
  University researchers just discovered all-natural seeds from the "Sword Tree" in East Nepal can speed up your testosterone production unlike anythine else...
  These seeds contain a rare compound that triggers a surge in your endochine system, scientifically proven to accelerate even the slowest testosterone production.
  Simple add it to your morning routine...
  And it takes the "parking brake" off your testosterone supply, skyrocketing your masculine energy and revitalizing your bedroom performance so you feel like a newlywed again.
  
  Common Enemy:
  This newly discovered compound is shaking the testosterone replacement therapy industry to its core.
  
  Additional Big Promises:
  Plus in studies, this amazing discovery has shown a positive effect on many common make degenerative problems, including belly fat, low metabolism, lack of focus, low mental energy, motivation and drive...everything that makes you feel like a man.
  
  Social Proof:
  More than 8654 men are already using this secret testosterone loophole every morning. Thet wake up - then add THIS to their daily routine. And it helps fire up their testosterone, even if they're quote unquote past their prime.
  
  It's easy, and works for anyone, regardless of age.
  
  Different than anything else:
  Remember this has nothing to do with injections, diets, surgery, pills or exercise
  
  Call to action #1 (Click the link, more social proof, more big promises and future pacing):
  While you still can, click  the link below to watch a short, free, special video that shows exactly why thiusands of men are flocking to this compound to recapture their youthful masculine drive, energy and performance.
  
  Imagine your belly fat melting away as your metabolism speeds up, and your masculine motivation, energy and drive skyrockets just like when you were young.
  
  Plus it can help revitalize your sexual performance so you feel like a newlywed again.
  
  Common Enemy:
  The billion dollar "Testosterone Replacement Theory" industry does NOT want you to see this video and discover this extraordinary secret.
  
  Final Call to Action (urgency):
  
  I urge you to click the button below and start using this method to revitalize your sexual performance and feel like a newlywed again.
  
  I am not sure how long this video will be available as pressure mounts from big pharma to take down this video. 
  
  Watch it now before it is too late.      
    `;
    var user_msg = `Write a video script in the same style and tone, structure, intent and voice using VSLFramework.\
    The script is about a ${selectionText}. Do not use me, us, I.`;
    
    const secondPromptCompletion = await generateChatCompletion(basePromptPrefix,user_msg);
    
    // Send the output when we're all done
    console.log(secondPromptCompletion);
    sendMessageToTab(secondPromptCompletion,tabId);
} catch (error) {
  console.log(error);

  // Add this here as well to see if we run into any errors!
  sendMessage(error.toString());
}
};

const generateCompletionAction = async (info) => {
try {
  // Send mesage with generating text (this will be like a loading indicator)
  sendMessage('generating...');

  const { selectionText } = info;
  const basePromptPrefix = `
    Write me a detailed table of contents for a blog post with the title below.
    
    Title:
    `;

    const baseCompletion = await generate(
      `${basePromptPrefix}${selectionText}`
    );
    
    const secondPrompt = `
      Take the table of contents and title of the blog post below and generate a blog post written in thwe style of Paul Graham. Make it feel like a story. Don't just list the points. Go deep into each one. Explain why.
      
      Title: ${selectionText}
      
      Table of Contents: ${baseCompletion.text}
      
      Blog Post:
    `;
    
    const secondPromptCompletion = await generate(secondPrompt);
    
    console.log(secondPromptCompletion.text);
    // Send the output when we're all done
    sendMessage(secondPromptCompletion.text);
} catch (error) {
  console.log(error);

  // Add this here as well to see if we run into any errors!
  sendMessage(error.toString());
}
};

// Don't touch this
chrome.runtime.onInstalled.addListener(() => {
chrome.contextMenus.create({
  id: 'context-run',
  title: 'Generate video script',
  contexts: ['selection'],
});
});

chrome.contextMenus.onClicked.addListener(generateChatCompletionAction);