# opcuax-client

## Output

```json
{
  "payload": {},
  "opcuax_client_id": "",
  "opcuax_client": {
    "clientName": "", //Client name
    "applicationName": "", //Application anem
    "sessionName": "", //Session name
    "endpointUrl": "" //Server endpoint url
  }
}
```

# browse

## Input

```json
{
  "payload": {},
  "opcuax_client_id": "", //Unique client identifier (Mandatory)
  "opcuax_browse": {
    "nodeId": "" //Unique node identifier (Optional)
  }
}
```

## Output

```json
{
  "payload": {},
  "opcuax_client_id": "", //Unique client identifier
  "opcuax_browse": {
    "nodeId": "", //Unique node identifier
    "result": [] //Browse result
  }
}
```

# read

## Input

```json
{
  "payload": {},
  "opcuax_client_id": "", //Unique client identifier (Mandatory)
  "opcuax_read": {
    "nodeId": "" //Unique node identifier (Optional)
  }
}
```

## Output

```json
{
  "payload": {},
  "opcuax_client_id": "", //Unique client identifier
  "opcuax_read": {
    "nodeId": "", //Unique node identifier
    "result": {} //Browse result
  }
}
```

# subscribe

## Input

```json
{
  "payload": {},
  "opcuax_client_id": "", //Unique client identifier (Mandatory)
  "opcuax_subscribe": {
    "nodeId": "", //Unique node identifier (Optional)
    "samplingInterval": 100 // 
  }
}
```

## Output

```json
{
  "payload": {},
  "opcuax_client_id": "", //Unique client identifier
  "opcuax_subscribe": {
    "nodeId": "", //Unique node identifier
    "result": {} //Browse result
  }
}
```