- [x] Only connect to the event stream when a chain is active. This will reduce the number of open connections and improve performance.
- [x] Implement a reconnection strategy for the event stream if there is not one. If the connection is lost, the client should automatically attempt to reconnect after a short delay.

## Chain Details Page
- [x] The command section should just be a list of commands with their respective icons. This will make it easier to read and understand the available commands. It should take up less space and be more visually appealing. If a command needs additional input, it can be displayed in a modal when the user clicks on it.
- [x] Add a list of online users. It should be designed with cards or similar. Each card should have the user's name, energy status, health, drug cooldown, and a button to issue a command to that user. This will allow chain leaders to quickly see who is online and their current status without having to navigate to a different page.
