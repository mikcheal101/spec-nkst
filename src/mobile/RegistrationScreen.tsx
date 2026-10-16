import { useState, useRef } from 'react'
import { View, Text, TextInput, Pressable, FlatList, ScrollView, Alert, ActivityIndicator, Switch, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useFeatureFlag } from './featureFlags'

interface Church {
  id: string
  name: string
}

const initialChurches: Church[] = [
  { id: '1', name: 'Lagos Island Church' },
  { id: '2', name: 'Surulere Church' },
  { id: '3', name: 'Mainland Church' },
]

export const RegistrationScreen = () => {
  const { state: flagState, isLoading: flagLoading } = useFeatureFlag('nkst.features.memberSelfService')
  const navigation = useNavigation()
  const queryClient = useQueryClient()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedChurchId, setSelectedChurchId] = useState('')
  const [isBaptised, setIsBaptised] = useState(false)
  const [baptismalNumber, setBaptismalNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const lastTapRef = useRef(Date.now())

  if (flagLoading) {
    return <Text>Loading feature flag...</Text>
  }

  if (flagState === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Coming soon</Text>
      </View>
    )
  }

  const churches = initialChurches
  const church = churches.find(c => c.id === selectedChurchId) || churches[0]

  const { isLoading: queryIsLoading, isError } = useQuery({
    queryKey: ['member', 'current'],
    queryFn: async () => {
      const res = await fetch('/api/members/current', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch member')
      return res.json()
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const lastTap = lastTapRef.current
      const now = Date.now()
      if (now - lastTap < 1000) {
        setSubmitted(true)
        return { error: 'Double tap detected, please wait' }
      }
      lastTapRef.current = now
      setSubmitted(false)
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', 'current'] })
      navigation.replace('Dashboard')
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Registration failed')
    },
  })

  const handleSubmit = () => {
    if (submitted) return
    if (!username || !password || !selectedChurchId) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }
    if (isBaptised && !baptismalNumber) {
      Alert.alert('Error', 'Please enter baptismal number')
      return
    }
    mutation.mutate({ username, password, churchId: selectedChurchId, isBaptised, baptismalNumber })
  }

  if (queryIsLoading) {
    return <ActivityIndicator size="large" />
  }

  if (isError) {
    return <Text style={styles.error}>Error loading member data</Text>
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Register</Text>
      </View>
      <View style={styles.inputGroup}>
        <TextInput
          placeholder="Username (phone/card number)"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
      </View>
      <View style={styles.churchGroup}>
        <Text style={styles.label}>Church</Text>
        <FlatList
          data={churches}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.churchButton,
                selectedChurchId === item.id && styles.churchButtonActive,
              ]}
              onPress={() => setSelectedChurchId(item.id)}
            >
              <Text style={styles.churchText}>{item.name}</Text>
            </Pressable>
          )}
        />
      </View>
      <View style={styles.baptismGroup}>
        <Text style={styles.label}>
          <Text>
            {isBaptised ? 'I am baptized' : 'I am not baptized'}
          </Text>
        </Text>
        <Switch
          value={isBaptised}
          onValueChange={setIsBaptised}
          thumbColor="#f0f0f0"
          trackColor="#e0e0e0"
        />
        {isBaptised && (
          <TextInput
            placeholder="Baptismal number"
            value={baptismalNumber}
            onChangeText={setBaptismalNumber}
            style={styles.input}
            autoCapitalize="none"
          />
        )}
      </View>
      <Pressable
        style={[
          styles.submitButton,
          submitted && styles.submitButtonDisabled,
          isLoading && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
      >
        {isLoading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Text style={styles.submitText}>Submit</Text>
        )}
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    color: '#666',
  },
  scroll: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    marginBottom: 8,
  },
  churchGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  churchButton: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#f9f9f9',
  },
  churchButtonActive: {
    borderWidth: 2,
    fontWeight: 'bold',
  },
  churchText: {
    fontSize: 16,
  },
  baptismGroup: {
    marginBottom: 15,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#0066ff',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
  },
})