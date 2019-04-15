# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# --------------------------------------------------------------------
# REMOVE all Log messages except warnings and errors
# --------------------------------------------------------------------
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int d(...);
}


# --------------------------------------------------------------------
# REMOVE android speech dependency from GV
# --------------------------------------------------------------------
-assumenosideeffects class android.speech.RecognizerIntent {
    *;
}

-assumenosideeffects class android.speech.tts.TextToSpeech {
    *;
}

-assumenosideeffects class org.mozilla.gecko.SpeechSynthesisService {
    *;
}

-assumenosideeffects class org.mozilla.gecko.util.InputOptionsUtils {
    public static boolean supportsVoiceRecognizer(android.content.Context, java.lang.String);
    public static android.content.Intent createVoiceRecognizerIntent(java.lang.String);
}

-dontwarn **
-target 1.7
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontpreverify
-verbose
-optimizations !code/simplification/arithmetic,!code/allocation/variable
-keep class !org.mozilla.gecko.Speech*, **
-keepclassmembers class !org.mozilla.gecko.Speech*, *{*;}
-keepattributes !org.mozilla.gecko.Speech*, *



