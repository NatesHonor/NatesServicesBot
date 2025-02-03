const { EmbedBuilder } = require('discord.js');

const faqResponses = {
  "why is my missionchief bot not working": "Are you running it from the command line or using the exe?",
};

const casualResponses = [
  "Hello! How can I help you today?",
  "Hi there! Need any assistance?",
  "Hey! How can I be of service?",
  "Hi! What can I do for you today?",
];

// Temporary state tracking (in-memory)
const userState = {};
const userRatings = {}; // Track ratings for users

async function handleChatSupport(message) {
  const query = message.content.toLowerCase().trim();
  console.log("User Query:", query); // Debugging: Log user query

  // Check if the user is in a follow-up state
  const state = userState[message.author.id];
  if (state && state.stage === 'setupQuestion') {
    if (query.includes('command line')) {
      sendCommandLineGuide(message);
      await sendReactionEmbed(message);  // After answering follow-up, send the reaction embed
      delete userState[message.author.id]; // Reset state after handling
      return;
    } else if (query.includes('exe')) {
      sendExeGuide(message);
      await sendReactionEmbed(message);  // After answering follow-up, send the reaction embed
      delete userState[message.author.id]; // Reset state after handling
      return;
    } else {
      message.channel.send("Please specify if you're using the Command Line or the exe.");
      return;
    }
  }

  // Check similarity with FAQ responses
  const bestMatch = Object.keys(faqResponses).find(q => query.includes(q));

  if (bestMatch) {
    const response = faqResponses[bestMatch];
    message.channel.send(response);

    // Update state for follow-up
    if (bestMatch === "why is my missionchief bot not working") {
      userState[message.author.id] = { stage: 'setupQuestion' };
    }
  } else {
    // Handle casual greetings if no FAQ match
    const casualMatch = casualResponses.some(response => query.includes(response.toLowerCase()));
    if (casualMatch) {
      const randomResponse = casualResponses[Math.floor(Math.random() * casualResponses.length)];
      message.channel.send(randomResponse);
    } else {
      message.channel.send("I'm sorry, I don't understand that question. Please try again.");
    }
  }
}

async function sendCommandLineGuide(message) {
  const embed = new EmbedBuilder()
    .setTitle("Command Line Installation Guide")
    .setURL("https://support.natemarcellus.com/docs/installation-guide.html#installation")
    .setDescription("Follow these steps to install the Missionchief Bot using the Command Line Interface (CLI):")
    .addFields([
      { name: "Step 1 - Downloading the Bot", value: "First step is to download the bot from the [download page](https://support.natemarcellus.com/docs/installation-guide.html#installation)." },
      { name: "Step 2 - Extracting the bot", value: "Find the downloaded zip file and extract it to a folder of your choice." },
      { name: "Step 3 - Creating the venv (Optional)", value: "Use `python -m venv .venv` and activate the venv with `.venv\\Scripts\\activate`." },
      { name: "Step 4 - Installing Requirements", value: "Run `pip install -r requirements.txt` to install dependencies." },
      { name: "Step 5 - Configuring the Bot", value: "Edit `config.ini` to set your username and password." },
      { name: "Step 6 - Running the Bot", value: "Run `python main.py` to start the bot." },
    ])
    .setFooter({ text: "Source: Nates Services Support" })
    .setColor("#00AAFF");

  message.channel.send({ embeds: [embed] });
}

async function sendExeGuide(message) {
  const embed = new EmbedBuilder()
    .setTitle("Exe Installation Guide")
    .setURL("https://support.natemarcellus.com/docs/installation-guide.html#installation")
    .setDescription("Follow these steps to install the Missionchief Bot using the exe file:")
    .addFields([
      { name: "Step 1 - Downloading the Bot", value: "Download the bot from the [download page](https://support.natemarcellus.com/docs/installation-guide.html#installation)." },
      { name: "Step 2 - Extracting the Bot", value: "Find the downloaded zip file and extract it to a folder of your choice." },
      { name: "Step 3 - Run the exe File", value: "Double-click the bot. No administrator access is required." },
      { name: "Step 4 - Configuring the Bot", value: "Click 'edit config.ini' to customize the settings." },
      { name: "Step 5 - Start the Bot", value: "Click 'start bot' to run the bot." },
    ])
    .setFooter({ text: "Source: Nate Marcellus Support" })
    .setColor("#00AAFF");

  message.channel.send({ embeds: [embed] });
}

async function sendReactionEmbed(message) {
  const embed = new EmbedBuilder()
    .setTitle("Your Reaction is Needed!")
    .setDescription("React with ✅ if everything was helpful, or ❌ if you'd like to cancel. This will expire in 5 minutes.")
    .setColor("#FF0000")
    .setFooter({ text: "You have 5 minutes to react!" });

  const sentMessage = await message.channel.send({ embeds: [embed] });

  // Add the ✅ and ❌ reactions to the embed
  await sentMessage.react('✅');
  await sentMessage.react('❌');

  // Set up a reaction collector that listens for ✅ and ❌ from the user
  const filter = (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id;
  const collector = sentMessage.createReactionCollector({ filter, time: 5 * 60 * 1000 });

  collector.on('collect', async (reaction) => {
    if (reaction.emoji.name === '✅') {
      await sentMessage.edit({
        embeds: [
          new EmbedBuilder()
            .setTitle("Glad I Could Help!")
            .setDescription("Please rate the AI response from 1 to 5 stars by typing the number.")
            .setColor("#00AAFF")
        ]
      });

      const ratingFilter = (responseMessage) => responseMessage.author.id === message.author.id && /^[1-5]$/.test(responseMessage.content);
      const ratingCollector = message.channel.createMessageCollector({ filter: ratingFilter, time: 60 * 1000 });

      ratingCollector.on('collect', async (ratingMessage) => {
        const rating = ratingMessage.content;
        await ratingMessage.delete(); // Remove the rating message from the chat

        await sentMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle("Thanks for Your Feedback!")
              .setDescription(`You rated the response: ${rating}/5`)
              .setColor("#00AAFF")
          ]
        });

        ratingCollector.stop();
      });

      ratingCollector.on('end', async () => {
        // If the rating collection times out, do nothing further
        if (!userRatings[message.author.id]) {
          await sentMessage.edit({
            embeds: [
              new EmbedBuilder()
                .setTitle("Feedback Expired")
                .setDescription("You did not provide a rating in time. Please try again later.")
                .setColor("#FF0000")
            ]
          });
        }
      });
    }
    // If ❌ is pressed, just end the reaction and do nothing more
    if (reaction.emoji.name === '❌') {
      await sentMessage.edit({
        embeds: [
          new EmbedBuilder()
            .setTitle("Reaction Cancelled")
            .setDescription("You cancelled the reaction process.")
            .setColor("#FF0000")
        ]
      });
    }
  });

  collector.on('end', async () => {
    // If no reaction is received within 5 minutes, time out
    await sentMessage.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle("Reaction Expired")
          .setDescription("The reaction has expired. Please try again later.")
          .setColor("#FF0000")
      ]
    });
  });
}

module.exports = { handleChatSupport };
