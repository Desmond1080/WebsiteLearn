import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import '../css/PetDetails.css'
import { FaUser, FaShoppingCart, FaMoneyBillWave } from 'react-icons/fa'
import BuyNow from '../PetsOrdering/BuyNow.jsx'

function PetDetails() {
  const { petId } = useParams()
  const navigate = useNavigate()
  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPetDetails()
  }, [petId])

  async function fetchPetDetails() {
    try {
      const result = await Promise.race([
        supabase
          .from('pets')
          .select('id, name, species, breed, age, status, image_url, description, price')
          .eq('id', petId)
          .maybeSingle(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 12000)
        ),
      ])

      const { data, error } = result

      if (error) {
        setError(error.message)
        return
      }

      setPet(data)
    } catch (e) {
      setError(e?.message || 'Failed to load pet details.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Loading pet details...</p>
  if (error) return <p>Error loading pet details: {error}</p>
  if (!pet) return <p>Pet not found.</p>

  return (
    <section id="pet-details">
      <button className="back-button" onClick={() => navigate(-1)}>
        Back
      </button>

      <div className="pet-details-card">
        <h1>{pet.name}</h1>
        {pet.image_url ? (
          <img src={pet.image_url} alt={pet.name} className="pet-details-image" />
        ) : (
          <div className="pet-details-placeholder">No Image</div>
        )}

        <p><strong>Species:</strong> {pet.species || 'N/A'}</p>
        <p><strong>Breed:</strong> {pet.breed || 'N/A'}</p>
        <p><strong>Age:</strong> {pet.age ?? 'N/A'}</p>
        <p><strong>Status:</strong> {pet.status || 'N/A'}</p>
        <p><strong>Price:</strong> RM{pet.price?.toFixed(2) || 'N/A'}</p>
        <p><strong>Description:</strong> {pet.description || 'N/A'}</p>

        <div className="pet-ordering-options">
            {/* add to cart button, buy now button */}
            <button className="add-to-cart-button">
                <FaShoppingCart /> 
            </button>
            <BuyNow pet={pet} />
                <button className="buy-now-button" onClick={() => alert('Buy Now functionality coming soon!')}>
                    <FaMoneyBillWave /> Buy Now { pet.price ? ` RM${pet.price.toFixed(2)}` : '' }
                </button>
        </div>
      </div>
    </section>
  )
}

export default PetDetails
