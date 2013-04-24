jquery.datetimeduck
===================

Jquery datetime picker plugin based on Jquery UI Datepicker

This plugin uses a "duck punching" technique, extending JQuery's UI Datepicker
and adding hour and minute selectors to it. Short! Simple! Just like you expected
from JQuery UI! 

Original code written by Andy Edinborough: 
http://edinborough.org/Duck-Punching-jQuery-UI-Datepicker-into-a-DateTimepicker

Usage
=====

Basic usage:

```
<label>Datetime: <input type="text" id="datetime" value="2012-01-31 10:20:00" />/label>

<script>
$('#datetime').datepicker();
</script>
```

It accepts all options from http://jqueryui.com/datepicker/ and a few others:

- *clockType*: 12 or 24. Default: 12
- *showTime*: true or false. Controls whether to show time.
- *altFormatSeparator*: used between date and time. Defaults to ' ' (useful for ISO8601) 

```
<label>Datetime: <input type="text" id="datetime" value="2012-01-31 10:20:00" />/label>

<script>
$('#datetime').datetimepicker({clockType: 24});
</script>
```
