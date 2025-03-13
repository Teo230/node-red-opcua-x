# TODO

# opcuax-client

## Output
```json
{
    payload: [...],
    opcuax_client: {
        connectionId: "",       //Unique client identifier
        clientName: "",         //Client name
        applicationName: "",    //Application anem
        sessionName: "",        //Session name
        endpointUrl: ""         //Server endpoint url
    }
}
```

# browse

## Input
```json
{
    payload: {},
    opcuax_browse{
        connectionId: "",       //Unique client identifier (Mandatory)
        nodeId: ""              //Unique node identifier (Optional)
    }
}
```