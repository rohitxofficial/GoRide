const PubNub = require("pubnub");

const credentials = {
  // {PUBNUB_CREDENTIALS}
};

const CHANNELS = {
  BLOCKCHAIN: "BLOCKCHAIN",
  CONFIRMED_BLOCKCHAIN: "CONFIRMED_BLOCKCHAIN",
};

class PubSub {
  constructor({ blockchain, confirmed_blockchain }) {
    this.blockchain = blockchain;
    this.confirmed_blockchain = confirmed_blockchain;

    this.pubnub = new PubNub(credentials);

    this.pubnub.subscribe({ channels: Object.values(CHANNELS) });

    this.pubnub.addListener(this.listener());
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain),
    });
  }

  broadcastConfirmedChain() {
    this.publish({
      channel: CHANNELS.CONFIRMED_BLOCKCHAIN,
      message: JSON.stringify(this.confirmed_blockchain.chain),
    });
  }

  listener() {
    return {
      message: (messageObject) => {
        const { channel, message } = messageObject;

        console.log(
          "Message reveived. Channel: " + channel + ". Message: " + message
        );

        const parsedMessage = JSON.parse(message);

        if (channel === CHANNELS.BLOCKCHAIN) {
          this.blockchain.replaceChain(parsedMessage);
        } else if (channel == CHANNELS.CONFIRMED_BLOCKCHAIN) {
          this.confirmed_blockchain.replaceChain(parsedMessage);
        }
      },
    };
  }

  publish({ channel, message }) {
    this.pubnub.publish({ channel, message });
  }
}

module.exports = PubSub;
